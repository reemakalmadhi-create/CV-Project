import os, sys, json
os.environ.setdefault('HF_HOME', '/Volumes/PNYRP60PSSD/viton/hf')
os.environ.setdefault('HF_HUB_OFFLINE', '1')
os.environ.setdefault('USE_TF', '0')
import numpy as np, cv2, torch
from PIL import Image, ImageFilter
SRC = '/Volumes/PNYRP60PSSD/viton/catvton_src'
sys.path.insert(0, SRC)
from diffusers import AutoencoderKL, DDIMScheduler, UNet2DConditionModel
from huggingface_hub import snapshot_download
from accelerate import load_checkpoint_in_model
from model.pipeline import CatVTONPipeline
from model.attn_processor import SkipAttnProcessor
from model.utils import get_trainable_module, init_adapter
from utils import resize_and_crop, resize_and_padding

DATA = '/Volumes/PNYRP60PSSD/viton/data'

# Chunked attention: at 1024x768 the person+cloth self-attention is 24k tokens,
# which needs 18 GB in one go. Splitting the queries keeps it under ~1 GB.
import types, torch.nn.functional as _F
import model.attn_processor as _AP
def _sdpa_chunked(q, k, v, attn_mask=None, dropout_p=0.0, is_causal=False, chunk=2048, **kw):
    if q.shape[-2] <= chunk:
        return _F.scaled_dot_product_attention(q, k, v, attn_mask=attn_mask, dropout_p=dropout_p, is_causal=is_causal)
    return torch.cat([_F.scaled_dot_product_attention(q[..., i:i + chunk, :], k, v, attn_mask=attn_mask, dropout_p=dropout_p)
                      for i in range(0, q.shape[-2], chunk)], dim=-2)
_AP.F = types.SimpleNamespace(**{n: getattr(_F, n) for n in dir(_F) if not n.startswith('__')})
_AP.F.scaled_dot_product_attention = _sdpa_chunked


def load_pipe(version='mix', dtype=torch.float16, device='mps', attn_file=None):
    base = snapshot_download('stable-diffusion-v1-5/stable-diffusion-inpainting')
    vae = snapshot_download('stabilityai/sd-vae-ft-mse')
    attn = snapshot_download('zhengchong/CatVTON')
    p = CatVTONPipeline.__new__(CatVTONPipeline)
    p.device, p.weight_dtype, p.skip_safety_check = device, dtype, True
    p.noise_scheduler = DDIMScheduler.from_pretrained(base, subfolder='scheduler')
    p.vae = AutoencoderKL.from_pretrained(vae).to(device, dtype=torch.float32)
    p.unet = UNet2DConditionModel.from_pretrained(base, subfolder='unet', variant='fp16', torch_dtype=dtype).to(device)
    init_adapter(p.unet, cross_attn_cls=SkipAttnProcessor)
    p.attn_modules = get_trainable_module(p.unet, 'attention')
    sub = {'mix': 'mix-48k-1024', 'vitonhd': 'vitonhd-16k-512'}[version]
    load_checkpoint_in_model(p.attn_modules, os.path.join(attn, sub, 'attention'))
    if attn_file:   # our own fine-tuned attention weights (catvton_finetune.py)
        from safetensors.torch import load_file
        p.attn_modules.load_state_dict(load_file(attn_file), strict=True)
    p.unet.to(device, dtype=dtype)
    # VAE runs in fp32 (fp16 VAE can give NaN); patch encode/decode dtype
    import utils as U
    orig = U.compute_vae_encodings
    def enc(image, vae):
        return orig(image.float(), vae).to(dtype)
    import model.pipeline as MP
    MP.compute_vae_encodings = enc
    dec = p.vae.decode
    p.vae.decode = lambda z, *a, **k: dec(z.float(), *a, **k)
    p.weight_dtype = dtype
    return p


# parse labels (VITON-HD image-parse-v3, LIP style)
HAT, HAIR, GLOVE, GLASSES, TOP, DRESS, COAT, SOCKS, PANTS, NECK, SCARF, SKIRT, FACE, LARM, RARM, LLEG, RLEG, LSHOE, RSHOE = range(1, 20)


def read_pose(path):
    d = json.load(open(path))
    if not d['people']:
        return None
    return np.array(d['people'][0]['pose_keypoints_2d'], np.float32).reshape(-1, 3)


def tryon_mask(name, split='test', cloth_name=None, size=(768, 1024), long_fit=True):
    """Where the new top may go. Same idea as CatVTON's AutoMasker 'upper':
    hull of old top + arms + neck, minus face, hair, hands, trousers.
    long_fit: if the new garment is longer than the old top, open the mask
    down over the trousers by the garment's own length (no old-shape leak)."""
    parse = np.array(Image.open(f'{DATA}/{split}/image-parse-v3/{name.replace(".jpg", ".png")}'))
    H, W = parse.shape
    k = max(W, H) // 250; k += (k % 2 == 0)
    ker = np.ones((k, k), np.uint8)
    isin = lambda labs: np.isin(parse, labs).astype(np.uint8)
    dense = cv2.dilate(isin([TOP, DRESS, COAT, NECK, LARM, RARM]), ker, iterations=2)
    weak = isin([PANTS, SKIRT, LLEG, RLEG, LSHOE, RSHOE, SOCKS, HAIR, HAT, GLASSES, SCARF, GLOVE])
    strong = isin([FACE])
    pose = read_pose(f'{DATA}/{split}/openpose_json/{name.replace(".jpg", "_keypoints.json")}')
    hands = np.zeros_like(parse, np.uint8)
    if pose is not None:
        sw = np.linalg.norm(pose[2, :2] - pose[5, :2]) if pose[2, 2] > .1 and pose[5, 2] > .1 else W * .25
        for e, w in [(3, 4), (6, 7)]:
            if pose[w, 2] > .1 and pose[e, 2] > .1:
                c = pose[w, :2] + .35 * (pose[w, :2] - pose[e, :2])
                cv2.circle(hands, tuple(int(v) for v in c), int(.28 * sw), 1, -1)
        hands &= isin([LARM, RARM, GLOVE])
        hands = cv2.dilate(hands, ker, iterations=1)
    strong |= hands
    body = ((1 - weak) & (parse != 0).astype(np.uint8)) | dense
    cs, _ = cv2.findContours(body * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    hull = np.zeros_like(body)
    for c in cs:
        hull |= cv2.fillPoly(np.zeros_like(body), [cv2.convexHull(c)], 1)
    m = hull & (1 - weak)
    if long_fit and cloth_name is not None and pose is not None and pose[1, 2] > .1:
        cm = np.array(Image.open(f'{DATA}/{split}/cloth-mask/{cloth_name}').convert('L').resize((W, H))) > 127
        ys, xs = np.where(cm)
        if len(ys):
            top_rows = cm[ys.min(): ys.min() + max(1, (ys.max() - ys.min()) // 5)]
            cw = top_rows.any(0).sum()          # garment shoulder width in cloth photo
            ch = ys.max() - ys.min()            # garment length in cloth photo
            sw = np.linalg.norm(pose[2, :2] - pose[5, :2]) if pose[2, 2] > .1 and pose[5, 2] > .1 else W * .25
            neck_y = pose[1, 1]
            bottom = int(neck_y + ch / max(cw, 1) * sw * 1.15)
            cur = np.where(m.any(1))[0]
            if len(cur) and bottom > cur.max():
                # torso width at the old hem, carried straight down to the new hem
                row = m[cur.max() - k * 3]
                xs_ = np.where(row)[0]
                if len(xs_):
                    x0, x1 = xs_.min(), xs_.max()
                    m[cur.max() - k * 3: min(bottom, H - 1), x0:x1 + 1] = 1
    m = (m & (1 - strong))
    m = cv2.dilate(m, ker, iterations=1) & (1 - strong)
    return Image.fromarray(m * 255).resize(size, Image.NEAREST)


def run(pipe, name, cloth_name, split='test', steps=50, cfg=2.5, size=(768, 1024), seed=42, long_fit=True):
    person = Image.open(f'{DATA}/{split}/image/{name}').convert('RGB')
    cloth = Image.open(f'{DATA}/{split}/cloth/{cloth_name}').convert('RGB')
    mask = tryon_mask(name, split, cloth_name if long_fit else None, size=person.size, long_fit=long_fit)
    person = resize_and_crop(person, size)
    cloth = resize_and_padding(cloth, size)
    mask = resize_and_crop(mask, size)
    g = torch.Generator('cpu').manual_seed(seed)
    out = pipe(person, cloth, mask, num_inference_steps=steps, guidance_scale=cfg,
               height=size[1], width=size[0], generator=g)[0]
    # paste back the untouched photo outside a softened mask (CatVTON 'repaint')
    soft = mask.filter(ImageFilter.GaussianBlur(4))
    a = np.array(soft, np.float32)[..., None] / 255.
    res = np.array(out, np.float32) * a + np.array(person, np.float32) * (1 - a)
    return Image.fromarray(res.clip(0, 255).astype(np.uint8)), person, cloth, mask

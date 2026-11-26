"""Fine-tune CatVTON's self-attention (the same 49.6M weights the authors trained) on the
VITON-HD TRAIN split, using OUR masks, starting from the vitonhd-16k-512 checkpoint.
Goal: adapt the model to the masks we build from label maps + pose (it was trained on the
official agnostic masks). Test photos are never used here.

env: STEPS (optimizer steps), ACC (grad accumulation), LR, MODE=test|train, AMP=bf16|fp32
"""
import os, sys, time, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catvton_lib import *
import pandas as pd
from diffusers import DDPMScheduler
from safetensors.torch import save_file

OUT = os.path.expanduser('~/virtual-tryon/run_catvton/ft'); os.makedirs(OUT, exist_ok=True)
STEPS, ACC = int(os.environ.get('STEPS', 1000)), int(os.environ.get('ACC', 4))
LR, MODE, AMP = float(os.environ.get('LR', 1e-5)), os.environ.get('MODE', 'train'), os.environ.get('AMP', 'bf16')
SIZE, dev = (384, 512), 'mps'
torch.manual_seed(0); random.seed(0)

base = snapshot_download('stable-diffusion-v1-5/stable-diffusion-inpainting')
vae = AutoencoderKL.from_pretrained(snapshot_download('stabilityai/sd-vae-ft-mse')).to(dev).eval().requires_grad_(False)
unet = UNet2DConditionModel.from_pretrained(base, subfolder='unet', variant='fp16', torch_dtype=torch.float32)
init_adapter(unet, cross_attn_cls=SkipAttnProcessor)
attn = get_trainable_module(unet, 'attention')
load_checkpoint_in_model(attn, os.path.join(snapshot_download('zhengchong/CatVTON'), 'vitonhd-16k-512', 'attention'))
unet.requires_grad_(False); attn.requires_grad_(True)
unet.enable_gradient_checkpointing(); unet.to(dev).train()
params = [p for p in attn.parameters() if p.requires_grad]
print(f'trainable {sum(p.numel() for p in params) / 1e6:.2f}M of {sum(p.numel() for p in unet.parameters()) / 1e6:.2f}M', flush=True)
opt = torch.optim.AdamW(params, lr=LR, weight_decay=1e-2)
sched = DDPMScheduler.from_pretrained(base, subfolder='scheduler')
ac = sched.alphas_cumprod.to(dev)

log = pd.read_csv(os.path.expanduser('~/virtual-tryon/run_v4/cleaning_log.csv'))
names = log[(log.split == 'train') & log.issues.isna()].name.tolist()
names = [n for n in names if os.path.exists(f'{DATA}/train/image-parse-v3/{n[:-4]}.png')]
print('train photos', len(names), flush=True)

to_t = lambda im: torch.from_numpy(np.asarray(im, np.float32) / 127.5 - 1).permute(2, 0, 1)[None].to(dev)


@torch.no_grad()
def batch(n):
    person = resize_and_crop(Image.open(f'{DATA}/train/image/{n}').convert('RGB'), SIZE)
    cloth = resize_and_padding(Image.open(f'{DATA}/train/cloth/{n}').convert('RGB'), SIZE)
    m = resize_and_crop(tryon_mask(n, 'train', None, size=Image.open(f'{DATA}/train/image/{n}').size, long_fit=False), SIZE)
    if random.random() < .5:   # horizontal flip
        person, cloth, m = [im.transpose(Image.FLIP_LEFT_RIGHT) for im in (person, cloth, m)]
    p, c = to_t(person), to_t(cloth)
    mk = torch.from_numpy((np.asarray(m, np.float32) > 127).astype(np.float32))[None, None].to(dev)
    enc = lambda x: vae.encode(x).latent_dist.sample() * vae.config.scaling_factor
    lp, lc, lm = enc(p), enc(c), enc(p * (1 - mk))
    mlat = torch.nn.functional.interpolate(mk, size=lp.shape[-2:], mode='nearest')
    if random.random() < .1:   # condition dropout, so classifier-free guidance keeps working
        lc_in = torch.zeros_like(lc)
    else:
        lc_in = lc
    x0 = torch.cat([lp, lc], -2)
    cond = torch.cat([torch.cat([mlat, torch.zeros_like(mlat)], -2), torch.cat([lm, lc_in], -2)], 1)
    return x0, cond


def save(tag):
    sd = {k: v.detach().float().cpu().contiguous() for k, v in attn.state_dict().items()}
    save_file(sd, f'{OUT}/attention_{tag}.safetensors')


amp = torch.autocast('mps', dtype=torch.bfloat16) if AMP == 'bf16' else torch.autocast('mps', enabled=False)
t0, losses, step = time.time(), [], 0
order = random.sample(names, len(names))
total = STEPS if MODE == 'train' else 4
while step < total:
    for a in range(ACC):
        x0, cond = batch(order[(step * ACC + a) % len(order)])
        noise = torch.randn_like(x0)
        t = torch.randint(0, 1000, (1,), device=dev)
        s = ac[t].sqrt().view(-1, 1, 1, 1); s1 = (1 - ac[t]).sqrt().view(-1, 1, 1, 1)
        xt = s * x0 + s1 * noise
        with amp:
            pred = unet(torch.cat([xt, cond], 1), t, encoder_hidden_states=None, return_dict=False)[0]
        loss = torch.nn.functional.mse_loss(pred.float(), noise) / ACC
        loss.backward(); losses.append(loss.item() * ACC)
    torch.nn.utils.clip_grad_norm_(params, 1.0)
    opt.step(); opt.zero_grad(set_to_none=True); step += 1
    if MODE == 'test' or step % 25 == 0:
        el = time.time() - t0
        print(f'step {step}/{total} | loss {np.mean(losses[-ACC * 25:]):.4f} | {el / step:.1f} s/step | '
              f'eta {(total - step) * el / step / 60:.0f} min | mem {torch.mps.driver_allocated_memory() / 2**30:.1f} GB', flush=True)
    if MODE == 'train' and step % 250 == 0:
        save(f'step{step}')
if MODE == 'train':
    save('final')
print('done', flush=True)

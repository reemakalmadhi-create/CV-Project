"""CatVTON try-on for ANY photo (not only VITON-HD test images).

VITON-HD photos come with label maps + pose. A user's own photo does not, so here a
clothes-parsing SegFormer (ATR labels) gives the body parts, and the same mask rule as our
notebook is applied: hull of old top + arms, minus face, hair, hands, trousers, bags.
Hands are found without a pose model: the arm pixels farthest from the torso.

Env:
  CATVTON_LIB_DIR   folder with catvton_lib.py            (default: this folder)
  CATVTON_VERSION   vitonhd (512x384) | mix (1024x768)     (default vitonhd)
  CATVTON_ATTN      our fine-tuned attention .safetensors  (optional)
  CATVTON_STEPS     DDIM steps                             (default 25)
"""
from __future__ import annotations

import os
import sys
import threading
import time

os.environ.setdefault("USE_TF", "0")
sys.path.insert(0, os.path.expanduser(os.environ.get("CATVTON_LIB_DIR", os.path.dirname(os.path.abspath(__file__)))))
from catvton_lib import (  # noqa: E402  (env must be set first)
    COAT, DRESS, FACE, GLASSES, GLOVE, HAIR, HAT, LARM, LLEG, LSHOE, PANTS, RARM, RLEG, RSHOE, SCARF, SKIRT, SOCKS, TOP,
    load_pipe, resize_and_crop, resize_and_padding,
)
import cv2  # noqa: E402
import numpy as np  # noqa: E402
import torch  # noqa: E402
from huggingface_hub import snapshot_download  # noqa: E402
from PIL import Image, ImageFilter, ImageOps  # noqa: E402
from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor  # noqa: E402

# SegFormer (ATR) id -> LIP id used by our mask rule
ATR2LIP = {0: 0, 1: HAT, 2: HAIR, 3: GLASSES, 4: TOP, 5: SKIRT, 6: PANTS, 7: DRESS, 8: PANTS, 9: LSHOE, 10: RSHOE,
           11: FACE, 12: LLEG, 13: RLEG, 14: LARM, 15: RARM, 16: GLOVE, 17: SCARF}
_LUT = np.zeros(256, np.uint8)
for a, b in ATR2LIP.items():
    _LUT[a] = b


class Parser:
    def __init__(self, device: str = "cpu"):
        path = snapshot_download("mattmdjaga/segformer_b2_clothes")
        self.proc = SegformerImageProcessor.from_pretrained(path)
        self.net = SegformerForSemanticSegmentation.from_pretrained(path).to(device).eval()
        self.device = device

    @torch.no_grad()
    def __call__(self, img: Image.Image) -> np.ndarray:
        x = self.proc(images=img, return_tensors="pt")["pixel_values"].to(self.device)
        logits = self.net(pixel_values=x).logits
        up = torch.nn.functional.interpolate(logits.float().cpu(), size=img.size[::-1], mode="bilinear", align_corners=False)
        return _LUT[up.argmax(1)[0].numpy().astype(np.uint8)]


def _largest(m: np.ndarray) -> np.ndarray:
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
    if n <= 1:
        return m.astype(np.uint8)
    return (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)


def garment_mask(cloth: Image.Image) -> np.ndarray:
    """Foreground of a product photo: differs from the border colour."""
    a = np.asarray(cloth.convert("RGB"), np.float32)
    border = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    bg = np.median(border, 0)
    m = (np.abs(a - bg).max(-1) > 28).astype(np.uint8)
    k = np.ones((5, 5), np.uint8)
    m = cv2.morphologyEx(cv2.morphologyEx(m, cv2.MORPH_CLOSE, k, iterations=2), cv2.MORPH_OPEN, k)
    m = _largest(m)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(m)
    cv2.drawContours(filled, cs, -1, 1, -1)
    return filled


def prepare_garment(cloth: Image.Image) -> tuple[Image.Image, np.ndarray]:
    """Clean an internet garment photo: transparent parts -> white, keep only the garment
    (drops hangers, props and background), crop to its own box."""
    cloth = ImageOps.exif_transpose(cloth)
    if cloth.mode in ("RGBA", "LA") or (cloth.mode == "P" and "transparency" in cloth.info):
        rgba = cloth.convert("RGBA")
        alpha = np.asarray(rgba)[..., 3]
        white = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        cloth = Image.alpha_composite(white, rgba).convert("RGB")
        m = _largest(alpha > 128)
    else:
        cloth = cloth.convert("RGB")
        m = garment_mask(cloth)
    # thin parts (hanger hook, strings) go away with an opening sized to the garment
    side = max(3, int(0.03 * max(m.shape)))
    m = _largest(cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((side, side), np.uint8)))
    ys, xs = np.where(m)
    if len(ys) < 0.02 * m.size:          # could not find it: use the photo as is
        return cloth, np.ones_like(m)
    soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.5)[..., None]
    arr = np.asarray(cloth, np.float32) * soft + 255 * (1 - soft)
    cloth = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    pad = int(0.04 * max(cloth.size))
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(cloth.width, xs.max() + pad), min(cloth.height, ys.max() + pad))
    return cloth.crop(box), m[box[1]:box[3], box[0]:box[2]]


def person_mask(parse: np.ndarray, cloth_mask: np.ndarray | None = None) -> np.ndarray:
    """Same rule as catvton_lib.tryon_mask, with hands found from the arm labels."""
    H, W = parse.shape
    k = max(W, H) // 250; k += (k % 2 == 0)
    ker = np.ones((k, k), np.uint8)
    isin = lambda labs: np.isin(parse, labs).astype(np.uint8)  # noqa: E731
    top = isin([TOP, DRESS, COAT])
    dense = cv2.dilate(isin([TOP, DRESS, COAT, LARM, RARM]), ker, iterations=2)
    weak = isin([PANTS, SKIRT, LLEG, RLEG, LSHOE, RSHOE, SOCKS, HAIR, HAT, GLASSES, SCARF, GLOVE])
    strong = isin([FACE])

    ys, xs = np.where(top)
    if len(ys):
        r = ys.min() + max(1, (ys.max() - ys.min()) // 6)
        row = np.where(top[r])[0]
        sw = (row.max() - row.min()) if len(row) else W * .25
        cy, cx = ys.mean(), xs.mean()
        neck_y = ys.min()
    else:
        sw, cy, cx, neck_y = W * .25, H * .45, W * .5, H * .2

    # hands: the end of each arm farthest from the torso centre
    hands = np.zeros_like(parse, np.uint8)
    for lab in (LARM, RARM):
        n, cc, stats, _ = cv2.connectedComponentsWithStats(isin([lab]))
        for i in range(1, n):
            comp = cc == i
            if stats[i, cv2.CC_STAT_AREA] < 50:
                continue
            py, px = np.where(comp)
            if stats[i, cv2.CC_STAT_AREA] < (0.30 * sw) ** 2:      # small piece = only the hand shows (long sleeves)
                hands |= comp.astype(np.uint8)
                continue
            d = (py - cy) ** 2 + (px - cx) ** 2
            j = np.argmax(d)
            tip = np.array([px[j], py[j]], np.float32)
            back = tip - np.array([cx, cy], np.float32)
            c = tip - back / (np.linalg.norm(back) + 1e-6) * 0.10 * sw
            disc = np.zeros_like(hands)
            cv2.circle(disc, (int(c[0]), int(c[1])), int(0.20 * sw), 1, -1)
            hands |= disc & comp.astype(np.uint8)
    hands = cv2.dilate(hands, ker, iterations=1)
    strong |= hands

    body = ((1 - weak) & (parse != 0).astype(np.uint8)) | dense
    cs, _ = cv2.findContours(body * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    hull = np.zeros_like(body)
    for c in cs:
        hull |= cv2.fillPoly(np.zeros_like(body), [cv2.convexHull(c)], 1)
    m = hull & (1 - weak)

    # longer garment (hoodie, long shirt): open the mask down to its own length
    if cloth_mask is not None and len(ys):
        cy_, cx_ = np.where(cloth_mask)
        if len(cy_):
            top_rows = cloth_mask[cy_.min(): cy_.min() + max(1, (cy_.max() - cy_.min()) // 5)]
            cw, ch = top_rows.any(0).sum(), cy_.max() - cy_.min()
            bottom = int(neck_y + ch / max(cw, 1) * sw * 1.15)
            cur = np.where(m.any(1))[0]
            if len(cur) and bottom > cur.max():
                rr = m[max(0, cur.max() - k * 3)]
                xr = np.where(rr)[0]
                if len(xr):
                    m[max(0, cur.max() - k * 3): min(bottom, H - 1), xr.min():xr.max() + 1] = 1
    m = m & (1 - strong)
    m = cv2.dilate(m, ker, iterations=1) & (1 - strong)
    return m


class Engine:
    def __init__(self):
        self.version = os.environ.get("CATVTON_VERSION", "vitonhd")
        self.attn = os.environ.get("CATVTON_ATTN") or None
        self.steps = int(os.environ.get("CATVTON_STEPS", 25))
        self.size = (384, 512) if self.version == "vitonhd" else (768, 1024)
        self.pipe = None
        self.parser = None
        self.error = ""
        self.lock = threading.Lock()

    def load(self):
        try:
            t = time.time()
            self.parser = Parser("cpu")
            self.pipe = load_pipe(self.version, attn_file=self.attn)
            print(f"CatVTON ready ({self.version}, weights={self.attn or 'original'}) in {time.time() - t:.0f}s", flush=True)
        except Exception as e:  # keep the service up and report why
            self.error = f"{type(e).__name__}: {e}"
            print("load failed:", self.error, flush=True)

    def ready(self) -> bool:
        return self.pipe is not None

    def status(self) -> str:
        if self.pipe is not None:
            w = "fine-tuned by our team" if self.attn else "original weights"
            return f"CatVTON ready · {self.size[0]}x{self.size[1]} · {self.steps} steps · {w}"
        return f"loading failed: {self.error}" if self.error else "CatVTON is loading…"

    def run(self, person: Image.Image, garment: Image.Image, seed: int = 42) -> tuple[Image.Image, Image.Image]:
        person = ImageOps.exif_transpose(person).convert("RGB")
        hi = resize_and_crop(person, (768, 1024))              # full-size photo we paste onto
        cloth, cmask = prepare_garment(garment)
        parse = self.parser(hi)
        m_hi = Image.fromarray(person_mask(parse, cmask) * 255)
        p_lo = hi.resize(self.size, Image.LANCZOS)
        m_lo = m_hi.resize(self.size, Image.NEAREST)
        c_lo = resize_and_padding(cloth, self.size)
        with self.lock:                                        # one try-on at a time on one GPU
            g = torch.Generator("cpu").manual_seed(seed)
            out = self.pipe(p_lo, c_lo, m_lo, num_inference_steps=self.steps, guidance_scale=2.5,
                            height=self.size[1], width=self.size[0], generator=g)[0]
            if torch.backends.mps.is_available():
                torch.mps.empty_cache()
        # paste only the try-on area back onto the sharp full-size photo
        soft = m_hi.filter(ImageFilter.GaussianBlur(6))
        a = np.asarray(soft, np.float32)[..., None] / 255.
        res = np.asarray(out.resize((768, 1024), Image.LANCZOS), np.float32) * a + np.asarray(hi, np.float32) * (1 - a)
        return Image.fromarray(res.clip(0, 255).astype(np.uint8)), m_hi

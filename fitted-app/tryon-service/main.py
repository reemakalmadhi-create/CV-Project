"""
FITTED try-on service: FastAPI around our CatVTON (pretrained, attention fine-tuned by our team).

The Next.js site calls it through TRYON_API_URL:
  GET  /health  -> {"ready": bool, "status": str}
  POST /tryon   multipart: person (file), garment (file) OR garment_url, garment_id, category, description
                -> {"status": "ok", "image_base64": "..."}       (real model output only)
                 | {"status": "pending", "message": "...", "detail": "..."}   (model still loading)
                 | {"status": "error", "message": "...", "detail": "..."}

Run (from this folder, in the Python env that has torch + diffusers):
  CATVTON_ATTN=~/virtual-tryon/run_catvton/ft/attention_final.safetensors uvicorn main:app --port 8000
"""
from __future__ import annotations

import base64
import io
import threading
import time
import urllib.request

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from catvton_engine import Engine

app = FastAPI(title="FITTED try-on service (CatVTON)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

engine = Engine()
threading.Thread(target=engine.load, daemon=True).start()   # /health answers while the model loads
PENDING = "Try-on model is still loading. Please try again in a minute."
TOPS_ONLY = "This model is trained on tops (VITON-HD). Pick the upper-body category."


def _download(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": "FITTED/1.0"})
    with urllib.request.urlopen(req, timeout=15) as res:
        img = Image.open(io.BytesIO(res.read()))
        img.load()
        return img


@app.get("/health")
def health() -> dict:
    return {"ready": engine.ready(), "status": engine.status()}


@app.post("/tryon")
def tryon(
    person: UploadFile = File(...),
    garment: UploadFile | None = File(None),
    garment_url: str = Form(""),
    garment_id: str = Form(""),
    category: str = Form("upper_body"),
    description: str = Form(""),
) -> dict:
    if not engine.ready():
        return {"status": "pending", "message": PENDING, "detail": engine.status()}
    if category != "upper_body":
        return {"status": "error", "message": TOPS_ONLY, "detail": f"category={category}"}
    try:
        person_img = Image.open(io.BytesIO(person.file.read()))
        if garment is not None:
            garment_img = Image.open(io.BytesIO(garment.file.read()))
        elif garment_url:
            garment_img = _download(garment_url)
        else:
            return {"status": "error", "message": "Please choose a garment.", "detail": "no garment"}
        t = time.time()
        result, _ = engine.run(person_img, garment_img)
        print(f"try-on {garment_id or 'upload'} in {time.time() - t:.0f}s", flush=True)
    except Exception as exc:  # model errors must not crash the service
        return {"status": "error", "message": "Try-on failed.", "detail": f"{type(exc).__name__}: {exc}"}
    buf = io.BytesIO()
    result.save(buf, format="PNG")
    return {"status": "ok", "image_base64": base64.b64encode(buf.getvalue()).decode()}

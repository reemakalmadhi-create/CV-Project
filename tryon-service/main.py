"""
FITTED try-on service — a small FastAPI app around model/idm_vton.

The Next.js site calls it through TRYON_API_URL:
  GET  /health  -> {"ready": bool, "status": str}
  POST /tryon   (multipart: person, garment_url, garment_id, category, description)
                -> {"status": "ok", "image_base64": "..."}       (real IDM-VTON output only)
                 | {"status": "pending", "message": "...", "detail": "..."}
                 | {"status": "error", "message": "...", "detail": "..."}

Until the IDM-VTON files are added and INTEGRATED = True in model/idm_vton/pipeline.py,
/tryon always answers "pending". It never returns the input photo or a placeholder.

Run:  uvicorn main:app --port 8000      (needs: pip install -r requirements.txt)
"""

from __future__ import annotations

import base64
import io
import urllib.request

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from model.idm_vton import GarmentCategory, IDMVTONNotIntegratedError, TryOnRequest, get_pipeline

app = FastAPI(title="FITTED try-on service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

PENDING = IDMVTONNotIntegratedError.USER_MESSAGE


def _download(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={"User-Agent": "FITTED/1.0"})
    with urllib.request.urlopen(req, timeout=15) as res:
        img = Image.open(io.BytesIO(res.read()))
        img.load()
        return img


@app.get("/health")
def health() -> dict:
    pipe = get_pipeline()
    return {"ready": pipe.is_available(), "status": pipe.status()}


@app.post("/tryon")
async def tryon(
    person: UploadFile = File(...),
    garment_url: str = Form(...),
    garment_id: str = Form(""),
    category: str = Form("upper_body"),
    description: str = Form(""),
) -> dict:
    pipe = get_pipeline()
    if not pipe.is_available():
        return {"status": "pending", "message": PENDING, "detail": pipe.status()}
    try:
        person_img = Image.open(io.BytesIO(await person.read())).convert("RGB")
        garment_img = _download(garment_url).convert("RGB")
        result = pipe.run(TryOnRequest(
            person_image=person_img,
            garment_image=garment_img,
            garment_description=description,
            category=GarmentCategory(category),
            garment_id=garment_id or None,
        ))
    except IDMVTONNotIntegratedError as exc:
        return {"status": "pending", "message": PENDING, "detail": exc.detail}
    except Exception as exc:  # model errors must not crash the service
        return {"status": "error", "message": "Try-on failed.", "detail": str(exc)}
    buf = io.BytesIO()
    result.image.save(buf, format="PNG")
    return {"status": "ok", "image_base64": base64.b64encode(buf.getvalue()).decode()}

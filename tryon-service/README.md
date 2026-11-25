# FITTED try-on service (Python)

Small FastAPI app that wraps `model/idm_vton/` (the same placeholder layer as the
Streamlit version). The Next.js site talks to it via the `TRYON_API_URL` env var.

```bash
cd tryon-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
# then in the Next.js .env.local:  TRYON_API_URL=http://localhost:8000
```

Until the IDM-VTON code + weights are added, `/tryon` answers
`{"status": "pending", "message": "IDM-VTON integration pending"}` — the site shows
that state and never a fake result.

**Adding the model later:** follow `model/idm_vton/README.md` (put files in `vendor/`,
`weights/`, `ckpt/`, fill in the functions marked NOT IMPLEMENTED, set
`INTEGRATED = True`). Run this service on a GPU machine (Vercel has no GPU) and point
`TRYON_API_URL` at it. No website code changes.

# FITTED try-on service (CatVTON)

FastAPI app that runs our try-on model. The Next.js site calls it through `TRYON_API_URL`.

- **Model:** CatVTON (Chong et al., ICLR 2025), built on Stable Diffusion 1.5 inpainting.
  We start from the `vitonhd-16k-512` checkpoint and fine-tune its self-attention layers
  on the VITON-HD train split with our own masks (`catvton_finetune.py`).
- **Any photo:** VITON-HD photos come with label maps and pose, user photos do not.
  `catvton_engine.py` uses a clothes-parsing SegFormer (`mattmdjaga/segformer_b2_clothes`)
  to find the shirt, arms, face and hands, then applies the same mask rule as our notebook.
- **Internet garment photos:** transparent backgrounds become white, hangers and background
  are removed, and the garment is cropped to its own box.
- **License:** CatVTON weights and code are CC BY-NC-SA 4.0 (non-commercial).

## Files

| File | What it does |
|---|---|
| `main.py` | FastAPI: `GET /health`, `POST /tryon` (multipart `person`, `garment` or `garment_url`, `category`) |
| `catvton_engine.py` | Parsing, mask, garment clean-up, one try-on at a time, paste back onto the full-size photo |
| `catvton_lib.py` | Loads CatVTON (fp16 UNet, fp32 VAE, chunked attention so 1024x768 fits in 16 GB) |
| `catvton_finetune.py` | Our fine-tune of the attention layers |

## Setup

1. Python 3.11, then `pip install -r requirements.txt` (keep the diffusers / huggingface_hub pins).
2. CatVTON code: download the Hugging Face Space `zhengchong/CatVTON` (folders `model/` and `utils.py`)
   and set `CATVTON_SRC` to that folder.
3. Weights download on first run into `HF_HOME`: `stable-diffusion-v1-5/stable-diffusion-inpainting`,
   `stabilityai/sd-vae-ft-mse`, `zhengchong/CatVTON`, `mattmdjaga/segformer_b2_clothes`.
   (`catvton_lib.py` sets `HF_HUB_OFFLINE=1`; set `HF_HUB_OFFLINE=0` for the first run.)
4. Optional: `CATVTON_ATTN=/path/attention_final.safetensors` to use our fine-tuned weights.

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

On a MacBook Air M4 (MPS) one try-on at 512x384 with 25 steps takes about 40-60 s.
`../start-mac.sh model|web|tunnel` runs the service, the site, and a public Cloudflare link on one Mac.

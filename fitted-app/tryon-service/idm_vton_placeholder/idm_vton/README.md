# model/idm_vton — integration layer (placeholder)

The official IDM-VTON code and weights are **not** included. They will be added
by hand in the model phase. Nothing in this project downloads, clones or
installs model code, weights, PyTorch or CUDA.

Until then every try-on request ends with **"IDM-VTON integration pending"**.
No function returns the input photo or any placeholder as a "result".

## Files

| File | Status | Purpose |
|---|---|---|
| `interface.py` | done | Input/output contract: `TryOnRequest`, `TryOnResult`, `GarmentCategory`, `IDMVTONNotIntegratedError` |
| `config.py` | done | Folder paths (override with env vars) and resolution (768×1024) |
| `pipeline.py` | wrapper done | Singleton that checks readiness, loads once, runs one request |
| `model_loader.py` | **NOT IMPLEMENTED** | `load_idm_vton_model(config)` |
| `preprocessing.py` | resize done; masking **NOT IMPLEMENTED** | `preprocess_inputs(person, garment, category)`, `build_agnostic_mask`, `build_densepose` |
| `inference.py` | entry point done; diffusion **NOT IMPLEMENTED** | `generate_tryon(person, garment, category)`, `run_inference(model, inputs, request)` |
| `requirements-model.txt` | empty | Heavy dependencies, filled in later |

## Folders to fill later

| Folder | What goes in it | Env var override |
|---|---|---|
| `vendor/` | Official IDM-VTON inference source code | `IDM_VTON_SOURCE_DIR` |
| `weights/` | Pretrained weights (UNets, VAE, encoders, scheduler) | `IDM_VTON_WEIGHTS_DIR` |
| `ckpt/` | Human-parsing, OpenPose, DensePose checkpoints | `IDM_VTON_CKPT_DIR` |

Device: `IDM_VTON_DEVICE` = `auto` (default), `cuda` or `cpu`.

## Contract

**Input — `TryOnRequest`**
- `person_image` (PIL RGB), `garment_image` (PIL RGB)
- `garment_description` (str), `category` (`upper_body` / `lower_body` / `dresses`)
- `num_inference_steps` (30), `guidance_scale` (2.0), `seed` (42)
- `auto_mask` (True) or a supplied `mask_image`

**Output — `TryOnResult`**
- `image` (PIL RGB, 768×1024), `mask`, `seed`, `elapsed_seconds`, `metadata`

## Call path

```
pages/try_on.py
  -> services/tryon_service.generate_tryon(person, garment, product, category)
     -> pipeline.get_pipeline().run(TryOnRequest)
        -> model_loader.load_idm_vton_model()        (once)
        -> preprocessing.preprocess_inputs()         (resize + mask + DensePose)
        -> inference.run_inference(model, inputs, request)
```

## When you add the files

1. Copy them into `vendor/`, `weights/`, `ckpt/`.
2. List the heavy packages in `requirements-model.txt` and install them on the
   GPU machine (not in the top-level `requirements.txt`).
3. Implement `load_idm_vton_model`, `build_agnostic_mask`, `build_densepose`,
   the end of `preprocess_inputs`, and `run_inference`. Keep torch/diffusers
   imports **inside** those functions.
4. Set `INTEGRATED = True` in `pipeline.py`.

No website code needs to change. The try-on page already shows a result,
the before/after comparison and the download button as soon as
`generate_tryon` returns `status="ok"`.

Streamlit Community Cloud has no GPU. For real inference, either run the whole
app on a GPU machine, or run this package behind an API on a GPU host and
replace the body of `services/tryon_service.generate_tryon` with an HTTP call.

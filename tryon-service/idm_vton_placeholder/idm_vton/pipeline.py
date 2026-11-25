"""
IDM-VTON pipeline wrapper — PLACEHOLDER.

The official IDM-VTON code and weights have not been added yet. Until they
are, `IDMVTONPipeline.run()` raises `IDMVTONNotIntegratedError`, which the app
shows as "IDM-VTON integration pending".

Integration checklist (model phase):
  1. Put the official source code in  model/idm_vton/vendor/
  2. Put the pretrained weights in    model/idm_vton/weights/
  3. Put parsing/pose/DensePose ckpts in model/idm_vton/ckpt/
  4. Add the heavy dependencies (torch, diffusers, transformers, ...) to
     model/idm_vton/requirements-model.txt and install them.
  5. Implement model_loader.load_idm_vton_model(),
     preprocessing.preprocess_inputs() and inference.run_inference().
     Keep every torch/diffusers import INSIDE those functions so the
     website still starts without them.
  6. Flip `INTEGRATED = True`.
"""

from __future__ import annotations

import time
from typing import Optional

from .config import DEFAULT_CONFIG, IDMVTONConfig, model_files_present
from .interface import IDMVTONNotIntegratedError, TryOnRequest, TryOnResult

# Set to True only after _load() and _infer() are implemented.
INTEGRATED = False


class IDMVTONPipeline:
    """Thin wrapper that owns the loaded model and runs one try-on at a time."""

    def __init__(self, config: IDMVTONConfig = DEFAULT_CONFIG) -> None:
        self.config = config
        self._model = None  # filled by _load()

    # ---- status ---------------------------------------------------------
    @staticmethod
    def is_available(config: IDMVTONConfig = DEFAULT_CONFIG) -> bool:
        """True only when the code is wired up AND the files are on disk."""
        return INTEGRATED and model_files_present(config)

    def status(self) -> str:
        if not INTEGRATED:
            return "IDM-VTON integration pending (pipeline not implemented yet)"
        if not model_files_present(self.config):
            return "IDM-VTON integration pending (model files not found)"
        return "ready"

    # ---- public API ----------------------------------------------------
    def run(self, request: TryOnRequest) -> TryOnResult:
        """Generate the try-on image. Raises IDMVTONNotIntegratedError for now."""
        if not self.is_available(self.config):
            raise IDMVTONNotIntegratedError(self.status())

        request.validate()
        if self._model is None:
            self._load()
        started = time.perf_counter()
        result = self._infer(request)
        result.elapsed_seconds = time.perf_counter() - started
        return result

    # ---- to implement in the model phase -------------------------------
    def _load(self) -> None:
        """Load UNets, VAE, encoders and scheduler (see model_loader.py)."""
        from .model_loader import load_idm_vton_model

        self._model = load_idm_vton_model(self.config)

    def _infer(self, request: TryOnRequest) -> TryOnResult:
        """Preprocess -> mask/pose -> diffusion -> TryOnResult."""
        from .inference import run_inference
        from .preprocessing import preprocess_inputs

        inputs = preprocess_inputs(
            request.person_image, request.garment_image, request.category,
            description=request.garment_description, mask=request.mask_image,
            config=self.config,
        )
        return run_inference(self._model, inputs, request)


_shared: Optional[IDMVTONPipeline] = None


def get_pipeline() -> IDMVTONPipeline:
    """Process-wide singleton so weights load only once."""
    global _shared
    if _shared is None:
        _shared = IDMVTONPipeline()
    return _shared

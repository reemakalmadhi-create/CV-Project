"""
IDM-VTON model loading — NOT IMPLEMENTED.

Nothing in this file downloads, imports or loads model code or weights yet.
Fill it in when the official IDM-VTON files are provided.
"""

from __future__ import annotations

from typing import Any

from .config import DEFAULT_CONFIG, IDMVTONConfig, model_files_present
from .interface import IDMVTONNotIntegratedError


def load_idm_vton_model(config: IDMVTONConfig = DEFAULT_CONFIG) -> Any:
    """NOT IMPLEMENTED — load IDM-VTON pretrained weights and dependencies.

    Future integration (model phase):
        * Import torch / diffusers / transformers HERE (inside the function),
          so the website keeps starting without them.
        * Load from `config.weights_dir`: the try-on UNet, the garment
          (reference) UNet, VAE, CLIP image encoder, the two text encoders +
          tokenizers and the scheduler, as the official inference script does.
        * Move them to `config.device` (resolve "auto" -> cuda if available),
          in float16 when `config.half_precision` and running on GPU.

    Args:
        config: Paths and runtime settings (see config.py).

    Returns:
        An object holding the loaded pipeline / modules. Its type is decided
        by the official code; `inference.run_inference()` receives it.

    Raises:
        IDMVTONNotIntegratedError: always, until implemented.
    """
    if not model_files_present(config):
        raise IDMVTONNotIntegratedError(
            f"model files not found in {config.weights_dir} / {config.source_dir}"
        )
    raise IDMVTONNotIntegratedError("load_idm_vton_model() is not implemented yet")

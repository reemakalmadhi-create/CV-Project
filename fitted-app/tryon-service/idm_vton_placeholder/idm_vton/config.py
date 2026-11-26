"""
Paths and default settings for IDM-VTON.

Nothing here downloads anything. These are the locations where YOU will place
the official files later. Override any path with an environment variable.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class IDMVTONConfig:
    # Folder holding the pretrained weights (UNet, garment UNet, VAE,
    # image encoder, text encoders, scheduler config).
    weights_dir: Path = Path(os.getenv("IDM_VTON_WEIGHTS_DIR", PACKAGE_DIR / "weights"))

    # Folder holding the official inference source code
    # (e.g. src/tryon_pipeline.py, src/unet_hacked_*.py, preprocess/...).
    source_dir: Path = Path(os.getenv("IDM_VTON_SOURCE_DIR", PACKAGE_DIR / "vendor"))

    # Human parsing / OpenPose / DensePose checkpoints used for auto-masking.
    ckpt_dir: Path = Path(os.getenv("IDM_VTON_CKPT_DIR", PACKAGE_DIR / "ckpt"))

    # Model input / output resolution (width, height).
    width: int = 768
    height: int = 1024

    # "cuda", "cpu" or "auto". Only read once the real pipeline exists.
    device: str = os.getenv("IDM_VTON_DEVICE", "auto")

    # Use float16 on GPU to save memory.
    half_precision: bool = True


DEFAULT_CONFIG = IDMVTONConfig()


def model_files_present(config: IDMVTONConfig = DEFAULT_CONFIG) -> bool:
    """True when both weights and source code folders contain files.

    This is only a cheap presence check; it does not validate the files.
    """

    def has_files(folder: Path) -> bool:
        return folder.is_dir() and any(
            p.name not in {".gitkeep", "README.md"} for p in folder.iterdir()
        )

    return has_files(config.weights_dir) and has_files(config.source_dir)

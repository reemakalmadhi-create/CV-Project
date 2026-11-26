"""
Input / output contract for the IDM-VTON integration.

This file defines WHAT the model layer receives and returns. It has no
dependency on PyTorch, diffusers, CUDA or Streamlit, so it is safe to import
before any model files exist.

When the official IDM-VTON code is added, `pipeline.py` must accept a
`TryOnRequest` and return a `TryOnResult` exactly as described here. The
Streamlit app only ever talks to these two types.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from PIL import Image


class GarmentCategory(str, Enum):
    """Garment region IDM-VTON should replace on the person."""

    UPPER_BODY = "upper_body"   # tees, shirts, knits, hoodies, jackets
    LOWER_BODY = "lower_body"   # trousers, skirts
    DRESSES = "dresses"         # full-length pieces (also used for long coats)


@dataclass
class TryOnRequest:
    """Everything one try-on needs.

    Attributes:
        person_image: RGB photo of the person, front-facing, full upper body
            visible. Any size; preprocessing resizes it to the model's input
            resolution (768 x 1024 by default, see config.py).
        garment_image: RGB product photo of the garment, ideally a flat or
            hanger shot on a plain background.
        garment_description: Short text prompt describing the garment, e.g.
            "olive wool knit cardigan with wooden buttons". IDM-VTON uses this
            as its text condition.
        category: Which body region the garment covers.
        garment_id: Catalog id, used only for logging and caching.
        num_inference_steps: Diffusion denoising steps (quality vs speed).
        guidance_scale: Classifier-free guidance strength.
        seed: Random seed for reproducible results; None = random.
        auto_mask: Generate the person's clothing mask automatically
            (human parsing + pose). If False, `mask_image` must be supplied.
        mask_image: Optional pre-computed binary mask (white = area to repaint).
    """

    person_image: Image.Image
    garment_image: Image.Image
    garment_description: str = ""
    category: GarmentCategory = GarmentCategory.UPPER_BODY
    garment_id: Optional[str] = None
    num_inference_steps: int = 30
    guidance_scale: float = 2.0
    seed: Optional[int] = 42
    auto_mask: bool = True
    mask_image: Optional[Image.Image] = None

    def validate(self) -> None:
        """Raise ValueError if the request cannot be processed."""
        if not isinstance(self.person_image, Image.Image):
            raise ValueError("person_image must be a PIL.Image")
        if not isinstance(self.garment_image, Image.Image):
            raise ValueError("garment_image must be a PIL.Image")
        if not self.auto_mask and self.mask_image is None:
            raise ValueError("mask_image is required when auto_mask is False")
        if not 1 <= self.num_inference_steps <= 100:
            raise ValueError("num_inference_steps must be between 1 and 100")
        if self.guidance_scale <= 0:
            raise ValueError("guidance_scale must be positive")


@dataclass
class TryOnResult:
    """What the model layer returns to the app.

    Attributes:
        image: Generated RGB image of the person wearing the garment, at the
            model's output resolution.
        mask: The mask that was used (useful for debugging); may be None.
        seed: The seed actually used.
        elapsed_seconds: Wall-clock inference time.
        metadata: Free-form extra info (model version, device, etc.).
    """

    image: Image.Image
    mask: Optional[Image.Image] = None
    seed: Optional[int] = None
    elapsed_seconds: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)


class IDMVTONNotIntegratedError(RuntimeError):
    """Raised when a try-on is requested before the model files are added."""

    USER_MESSAGE = "IDM-VTON integration pending"

    def __init__(self, detail: str = "") -> None:
        msg = self.USER_MESSAGE + (f": {detail}" if detail else "")
        super().__init__(msg)
        self.detail = detail

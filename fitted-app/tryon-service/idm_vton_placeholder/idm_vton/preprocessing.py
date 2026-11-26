"""
Image preparation steps that run before IDM-VTON.

Only lightweight PIL work is implemented now (resize/pad). The steps that need
model checkpoints (human parsing, pose, DensePose) are documented stubs.
"""

from __future__ import annotations

from typing import Optional, Union

from PIL import Image, ImageOps

from .config import DEFAULT_CONFIG, IDMVTONConfig
from .interface import GarmentCategory, IDMVTONNotIntegratedError


def fit_to_canvas(image: Image.Image, size: tuple[int, int], fill=(255, 255, 255)) -> Image.Image:
    """Resize keeping aspect ratio, then pad to exactly `size` (width, height)."""
    image = ImageOps.exif_transpose(image).convert("RGB")
    return ImageOps.pad(image, size, color=fill, centering=(0.5, 0.5))


def prepare_person(image: Image.Image, config: IDMVTONConfig = DEFAULT_CONFIG) -> Image.Image:
    """Person photo -> model input size."""
    return fit_to_canvas(image, (config.width, config.height))


def prepare_garment(image: Image.Image, config: IDMVTONConfig = DEFAULT_CONFIG) -> Image.Image:
    """Garment photo -> model input size, transparent areas filled white."""
    if image.mode in ("RGBA", "LA", "P"):
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        image = Image.alpha_composite(background, rgba)
    return fit_to_canvas(image, (config.width, config.height))


def build_agnostic_mask(person: Image.Image, category: str) -> Image.Image:
    """TODO (model phase): human parsing + OpenPose -> clothing mask.

    Expected output: single-channel "L" image, same size as `person`,
    white (255) where the garment should be generated.
    """
    raise IDMVTONNotIntegratedError("auto-masking needs the parsing/pose checkpoints")


def build_densepose(person: Image.Image) -> Image.Image:
    """TODO (model phase): DensePose map of the person.

    Expected output: RGB image, same size as `person`.
    """
    raise IDMVTONNotIntegratedError("DensePose needs its checkpoint")


def preprocess_inputs(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: Union[GarmentCategory, str],
    description: str = "",
    mask: Optional[Image.Image] = None,
    config: IDMVTONConfig = DEFAULT_CONFIG,
) -> dict:
    """NOT IMPLEMENTED — prepare inputs according to the official IDM-VTON pipeline.

    Implemented today: resizing/padding both images to the model resolution
    (`prepare_person`, `prepare_garment`). Not implemented: the clothing mask
    and DensePose map, which need the parsing/pose checkpoints.

    Expected return value once integrated:
        {
          "person":     PIL RGB 768x1024,
          "garment":    PIL RGB 768x1024,
          "mask":       PIL "L" 768x1024 (white = repaint),
          "mask_gray":  PIL RGB 768x1024 (person with masked area greyed),
          "densepose":  PIL RGB 768x1024,
          "prompt":         "model is wearing " + description,
          "garment_prompt": "a photo of " + description,
          "category":   GarmentCategory,
        }

    Raises:
        IDMVTONNotIntegratedError: until masking/DensePose are implemented.
    """
    category = GarmentCategory(category)
    person = prepare_person(person_image, config)
    garment = prepare_garment(garment_image, config)
    if mask is None:
        mask = build_agnostic_mask(person, category.value)   # raises for now
    densepose = build_densepose(person)                      # raises for now
    raise IDMVTONNotIntegratedError("preprocess_inputs() is not implemented yet")

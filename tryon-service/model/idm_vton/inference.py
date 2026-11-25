"""
IDM-VTON inference — NOT IMPLEMENTED.

`generate_tryon()` is the single entry point the website uses (through
services/tryon_service.py). Until the official model is integrated it raises
`IDMVTONNotIntegratedError`. It never returns the input image or any other
placeholder as a "result".
"""

from __future__ import annotations

from typing import Any, Union

from PIL import Image

from .interface import GarmentCategory, IDMVTONNotIntegratedError, TryOnRequest, TryOnResult
from .pipeline import get_pipeline


def generate_tryon(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: Union[GarmentCategory, str] = GarmentCategory.UPPER_BODY,
    garment_description: str = "",
    **options: Any,
) -> TryOnResult:
    """Run IDM-VTON and return the generated image.

    Args:
        person_image: PIL RGB photo of the person (full body or upper body).
        garment_image: PIL RGB product photo of the garment.
        category: "upper_body", "lower_body" or "dresses".
        garment_description: Text prompt describing the garment.
        **options: Any other `TryOnRequest` field (num_inference_steps,
            guidance_scale, seed, auto_mask, mask_image, garment_id).

    Returns:
        TryOnResult whose `.image` is the generated 768×1024 RGB image.

    Raises:
        IDMVTONNotIntegratedError: until the model is integrated.
        ValueError: if the inputs are invalid (once integrated).
    """
    request = TryOnRequest(
        person_image=person_image,
        garment_image=garment_image,
        garment_description=garment_description,
        category=GarmentCategory(category),
        **options,
    )
    return get_pipeline().run(request)


def run_inference(model: Any, inputs: dict, request: TryOnRequest) -> TryOnResult:
    """NOT IMPLEMENTED — the actual diffusion call.

    Future integration (model phase):
        `model`  — whatever `model_loader.load_idm_vton_model()` returned.
        `inputs` — output of `preprocessing.preprocess_inputs()`:
                   person, garment, mask, mask_gray, densepose (all PIL,
                   768×1024) and the text prompts.
        Call the official try-on pipeline with `request.num_inference_steps`,
        `request.guidance_scale` and a generator seeded with `request.seed`,
        then wrap the first output image in a `TryOnResult`.

    Raises:
        IDMVTONNotIntegratedError: always, until implemented.
    """
    raise IDMVTONNotIntegratedError("run_inference() is not implemented yet")


def is_ready() -> bool:
    return get_pipeline().is_available()


def status() -> str:
    return get_pipeline().status()


__all__ = ["generate_tryon", "run_inference", "is_ready", "status"]

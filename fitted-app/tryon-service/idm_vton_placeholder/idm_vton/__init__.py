"""
IDM-VTON model package (placeholder).

Public API used by the app:
    from model.idm_vton import TryOnRequest, TryOnResult, get_pipeline,
                               IDMVTONNotIntegratedError, GarmentCategory

No heavy dependencies are imported here.
"""

from .config import DEFAULT_CONFIG, IDMVTONConfig, model_files_present
from .interface import (
    GarmentCategory,
    IDMVTONNotIntegratedError,
    TryOnRequest,
    TryOnResult,
)
from .pipeline import IDMVTONPipeline, get_pipeline

__all__ = [
    "DEFAULT_CONFIG",
    "GarmentCategory",
    "IDMVTONConfig",
    "IDMVTONNotIntegratedError",
    "IDMVTONPipeline",
    "TryOnRequest",
    "TryOnResult",
    "get_pipeline",
    "model_files_present",
]

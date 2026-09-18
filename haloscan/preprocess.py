from __future__ import annotations

import cv2
import numpy as np
from PIL import Image


def load_image(source) -> np.ndarray:
    """Load image as grayscale float32 in [0, 1]."""
    if isinstance(source, Image.Image):
        arr = np.array(source.convert("L"), dtype=np.float32) / 255.0
        return arr
    if isinstance(source, str):
        arr = cv2.imread(source, cv2.IMREAD_GRAYSCALE)
        if arr is None:
            raise ValueError(f"Could not read image: {source}")
        return arr.astype(np.float32) / 255.0
    if isinstance(source, np.ndarray):
        if source.ndim == 3:
            gray = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)
        else:
            gray = source
        if gray.dtype == np.uint8:
            return gray.astype(np.float32) / 255.0
        return gray.astype(np.float32)
    raise TypeError(f"Unsupported image type: {type(source)}")


def enhance_xray(gray: np.ndarray, clip_limit: float = 2.5) -> np.ndarray:
    """CLAHE + inversion so dense objects read as bright."""
    u8 = (np.clip(gray, 0, 1) * 255).astype(np.uint8)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    eq = clahe.apply(u8)
    inv = 255 - eq
    return inv.astype(np.float32) / 255.0


def enhance_xray_mild(gray: np.ndarray) -> np.ndarray:
    """Lighter CLAHE — used to reject enhancement-only false halos."""
    return enhance_xray(gray, clip_limit=1.2)


def to_rgb_tensor(gray: np.ndarray, size: int = 224) -> np.ndarray:
    """Resize and stack to 3-channel HWC float."""
    u8 = (np.clip(gray, 0, 1) * 255).astype(np.uint8)
    resized = cv2.resize(u8, (size, size), interpolation=cv2.INTER_AREA)
    rgb = np.stack([resized, resized, resized], axis=-1).astype(np.float32) / 255.0
    return rgb

"""Photorealistic synthetic pediatric foreign-body X-ray generator."""

from __future__ import annotations

import random

import cv2
import numpy as np

# label: 0=battery, 1=coin, 2=stacked_coins, 3=normal
LABEL_NAMES = ["battery", "coin", "stacked_coins", "normal"]


def _xray_background(size: int = 320) -> np.ndarray:
    bg = np.random.normal(0.32, 0.07, (size, size)).astype(np.float32)
    bg = cv2.GaussianBlur(bg, (0, 0), 2.5)
    # spine column
    spine_x = size // 2 + random.randint(-8, 8)
    cv2.line(bg, (spine_x, 0), (spine_x, size), float(random.uniform(0.28, 0.38)), 3)
    # ribs
    for _ in range(random.randint(3, 6)):
        y = random.randint(size // 6, 5 * size // 6)
        cv2.ellipse(
            bg,
            (size // 2, y),
            (size // 2 - 10, random.randint(12, 28)),
            0,
            200,
            340,
            float(random.uniform(0.22, 0.36)),
            1,
        )
    # soft tissue gradient
    grad = np.linspace(0.05, 0.0, size, dtype=np.float32)
    bg += grad[:, None]
    return np.clip(bg, 0, 1)


def _add_noise(img: np.ndarray) -> np.ndarray:
    noise = np.random.normal(0, random.uniform(0.015, 0.035), img.shape).astype(np.float32)
    blur = cv2.GaussianBlur(img, (0, 0), random.uniform(0.3, 0.9))
    return np.clip(blur + noise, 0, 1)


def draw_coin(bg: np.ndarray, cx: int, cy: int, r: int) -> np.ndarray:
    """Homogeneous disc — flat density, soft single rim (no false halo rings)."""
    img = bg.copy()
    density = random.uniform(0.78, 0.86)
    cv2.circle(img, (cx, cy), r, density, -1)
    # Soft 1px rim only — avoid a second concentric ring
    cv2.circle(img, (cx, cy), r, min(1.0, density + 0.04), 1)
    return _add_noise(img)


def draw_battery_ap(bg: np.ndarray, cx: int, cy: int, r: int) -> np.ndarray:
    img = bg.copy()
    cv2.circle(img, (cx, cy), r, random.uniform(0.85, 0.94), 2)
    cv2.circle(img, (cx, cy), int(r * 0.72), random.uniform(0.48, 0.62), -1)
    cv2.circle(img, (cx, cy), int(r * 0.34), random.uniform(0.72, 0.84), -1)
    return _add_noise(img)


def draw_stacked_coins_ap(bg: np.ndarray, cx: int, cy: int, r: int) -> np.ndarray:
    """Stacked coins that reproduce the double-halo sign (Reese's Law hard case).

    Clinically the AP looks nearly identical to a button battery — so we paint
    battery-like concentric rings, then add a second offset rim (the stack).
    """
    img = bg.copy()
    # Battery-like false halo (what fools radiologists)
    cv2.circle(img, (cx, cy), r, random.uniform(0.86, 0.95), 2)
    cv2.circle(img, (cx, cy), int(r * 0.72), random.uniform(0.45, 0.60), -1)
    cv2.circle(img, (cx, cy), int(r * 0.34), random.uniform(0.72, 0.84), -1)
    # Second coin offset — multi-rim / multi-peak AP signature
    offset = max(2, int(r * 0.18))
    cv2.circle(img, (cx + offset, cy), r, random.uniform(0.88, 0.96), 2)
    cv2.circle(img, (cx - offset // 2, cy), int(r * 0.55), random.uniform(0.88, 0.96), 1)
    return _add_noise(img)


def draw_battery_lateral(bg: np.ndarray, cx: int, cy: int, r: int) -> np.ndarray:
    img = bg.copy()
    h, w = int(r * 1.2), int(r * 1.85)
    x0, y0 = cx - w // 2, cy - h // 2
    cv2.rectangle(img, (x0, y0), (x0 + w, y0 + h), random.uniform(0.82, 0.92), -1)
    cv2.rectangle(
        img,
        (x0 + w // 3, y0 - h // 4),
        (x0 + w, y0 + h // 3),
        random.uniform(0.88, 0.97),
        -1,
    )
    return _add_noise(img)


def draw_coin_lateral(bg: np.ndarray, cx: int, cy: int, r: int) -> np.ndarray:
    img = bg.copy()
    cv2.ellipse(img, (cx, cy), (int(r * 0.35), r), 0, 0, 360, random.uniform(0.82, 0.92), -1)
    return _add_noise(img)


def generate_sample(
    label: int,
    size: int = 320,
    lateral: bool = False,
    seed: int | None = None,
) -> np.ndarray:
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
    bg = _xray_background(size)
    cx = random.randint(size // 4, 3 * size // 4)
    cy = random.randint(size // 4, 3 * size // 4)
    r = random.randint(size // 11, size // 7)

    if label == 0:
        return draw_battery_lateral(bg, cx, cy, r) if lateral else draw_battery_ap(bg, cx, cy, r)
    if label == 1:
        return draw_coin_lateral(bg, cx, cy, r) if lateral else draw_coin(bg, cx, cy, r)
    if label == 2:
        return draw_stacked_coins_ap(bg, cx, cy, r)
    return _add_noise(bg)


def augment(gray: np.ndarray) -> np.ndarray:
    if random.random() < 0.5:
        gray = cv2.flip(gray, 1)
    if random.random() < 0.4:
        gray = cv2.GaussianBlur(gray, (0, 0), random.uniform(0.4, 1.2))
    if random.random() < 0.3:
        alpha = random.uniform(0.85, 1.15)
        gray = np.clip(gray * alpha, 0, 1)
    return gray

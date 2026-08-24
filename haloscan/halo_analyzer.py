from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class HaloAnalysis:
    halo_score: float
    stepoff_score: float
    coin_score: float
    battery_score: float
    center: tuple[int, int] | None
    radius: int
    radial_profile: list[float]
    explanation: str
    profile_peaks: int = 0
    stacked_mimic_score: float = 0.0


def _find_disc(enhanced: np.ndarray) -> tuple[tuple[int, int], int] | None:
    u8 = (np.clip(enhanced, 0, 1) * 255).astype(np.uint8)
    blur = cv2.GaussianBlur(u8, (9, 9), 0)

    # Primary: Otsu contour detection
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    result = _best_circular_contour(thresh, enhanced.shape)
    if result:
        return result

    # Fallback: Hough circles (handles low-contrast discs)
    circles = cv2.HoughCircles(
        blur, cv2.HOUGH_GRADIENT, dp=1.2, minDist=30,
        param1=80, param2=28, minRadius=8, maxRadius=min(enhanced.shape) // 4,
    )
    if circles is not None:
        h, w = enhanced.shape
        best = None
        best_score = -1.0
        for c in circles[0]:
            cx, cy, r = int(c[0]), int(c[1]), int(c[2])
            dist_penalty = abs(cx - w / 2) / w + abs(cy - h / 2) / h
            score = 1.0 - 0.4 * dist_penalty
            if score > best_score:
                best_score = score
                best = ((cx, cy), r)
        return best

    # Fallback: adaptive threshold
    adapt = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 4)
    return _best_circular_contour(adapt, enhanced.shape)


def _best_circular_contour(thresh: np.ndarray, shape: tuple[int, ...]) -> tuple[tuple[int, int], int] | None:
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    h, w = shape[:2]
    min_area = (min(h, w) * 0.015) ** 2
    best = None
    best_score = -1.0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        (x, y), radius = cv2.minEnclosingCircle(cnt)
        if radius < 6:
            continue
        circularity = 4 * np.pi * area / (cv2.arcLength(cnt, True) ** 2 + 1e-6)
        if circularity < 0.38:
            continue
        cx, cy = int(x), int(y)
        dist_penalty = abs(cx - w / 2) / w + abs(cy - h / 2) / h
        score = circularity - 0.35 * dist_penalty
        if score > best_score:
            best_score = score
            best = ((cx, cy), int(radius))
    return best


def _radial_profile(enhanced: np.ndarray, center: tuple[int, int], radius: int) -> np.ndarray:
    h, w = enhanced.shape
    cx, cy = center
    samples = []
    for r in range(max(2, radius // 6), radius + 2, max(1, radius // 24)):
        vals = []
        for deg in range(0, 360, 8):
            rad = np.deg2rad(deg)
            x = int(cx + r * np.cos(rad))
            y = int(cy + r * np.sin(rad))
            if 0 <= x < w and 0 <= y < h:
                vals.append(enhanced[y, x])
        if vals:
            samples.append(float(np.mean(vals)))
    if len(samples) < 4:
        return np.zeros(8, dtype=np.float32)
    arr = np.array(samples, dtype=np.float32)
    arr = (arr - arr.min()) / (arr.max() - arr.min() + 1e-6)
    return arr


def _halo_score(profile: np.ndarray) -> float:
    """Battery AP: lucent inner ring → deep mid-radius intensity dip."""
    if len(profile) < 5:
        return 0.0
    p = profile.astype(np.float32)
    n = len(p)
    mid_min = float(np.min(p[n // 4 : 3 * n // 4]))
    outer = float(np.mean(p[3 * n // 4 :]))
    inner = float(np.mean(p[: n // 4]))
    rim = max(outer, inner)
    dip = rim - mid_min
    rng = float(p.max() - p.min())
    if rng < 0.08:
        return 0.0
    # Deep central lucency (< 0.12) is the battery hallmark
    if mid_min > 0.14:
        return float(np.clip(dip / rng * 0.2, 0, 0.15))
    return float(np.clip(dip / rng * 1.05 + (0.14 - mid_min), 0, 1))


def _stepoff_score(enhanced: np.ndarray, center: tuple[int, int], radius: int) -> float:
    """Lateral view: battery poles create asymmetric vertical mass distribution."""
    h, w = enhanced.shape
    cx, cy = center
    x0 = max(0, cx - radius)
    x1 = min(w, cx + radius)
    y0 = max(0, cy - radius)
    y1 = min(h, cy + radius)
    roi = enhanced[y0:y1, x0:x1]
    if roi.size == 0:
        return 0.0
    col = roi.mean(axis=1)
    if len(col) < 6:
        return 0.0
    third = max(1, len(col) // 3)
    top = float(col[:third].mean())
    mid = float(col[third : 2 * third].mean())
    bot = float(col[2 * third :].mean())
    asym = abs(top - bot) + 0.5 * abs(top - mid) + 0.5 * abs(bot - mid)
    return float(np.clip(asym * 2.2, 0, 1))


def _count_profile_peaks(profile: np.ndarray) -> int:
    """Count significant peaks — stacked coins often show 3+ rings on AP."""
    if len(profile) < 5:
        return 0
    sm = np.convolve(profile.astype(np.float32), np.ones(3) / 3, mode="same")
    thresh = float(np.mean(sm) + 0.07)
    peaks = 0
    for i in range(1, len(sm) - 1):
        if sm[i] > sm[i - 1] and sm[i] > sm[i + 1] and sm[i] >= thresh:
            peaks += 1
    return peaks


def _stacked_mimic_score(profile: np.ndarray, halo: float, stepoff: float, view: str) -> float:
    """Elevated when AP radial profile has multi-ring pattern without lateral step-off."""
    if view != "ap":
        return 0.0
    peaks = _count_profile_peaks(profile)
    if peaks >= 4:
        return float(np.clip(0.52 + 0.08 * (peaks - 3), 0, 1))
    if peaks >= 3 and halo > 0.12:
        return float(np.clip(0.42 + 0.12 * (peaks - 2) + 0.22 * halo, 0, 1))
    if peaks >= 2 and halo > 0.30 and stepoff < 0.22:
        return float(np.clip(0.35 + 0.40 * halo, 0, 1))
    if halo > 0.42 and stepoff < 0.18:
        return float(np.clip(0.30 + 0.50 * halo, 0, 1))
    return 0.0


def _homogeneity_score(profile: np.ndarray) -> float:
    """Coins have monotonically increasing radial density; batteries do not."""
    if len(profile) < 4:
        return 0.5
    diffs = np.diff(profile)
    return float(np.clip(np.mean(diffs > -0.02) * 1.15, 0, 1))


def analyze_halo(enhanced: np.ndarray, view: str = "ap") -> HaloAnalysis:
    disc = _find_disc(enhanced)
    if disc is None:
        return HaloAnalysis(
            halo_score=0.0,
            stepoff_score=0.0,
            coin_score=0.55,
            battery_score=0.35,
            center=None,
            radius=0,
            radial_profile=[],
            explanation="No distinct round foreign body detected. If ingestion suspected, obtain dedicated AP/lateral neck or chest films.",
        )

    center, radius = disc
    profile = _radial_profile(enhanced, center, radius)
    profile_arr = np.array(profile)
    halo = _halo_score(profile_arr)
    peaks = _count_profile_peaks(profile_arr)
    mimic = _stacked_mimic_score(profile_arr, halo, 0.0, view)
    homog = _homogeneity_score(profile_arr)
    stepoff = _stepoff_score(enhanced, center, radius) if view == "lateral" else 0.0
    if view == "ap":
        mimic = _stacked_mimic_score(profile_arr, halo, stepoff, view)

    if view == "lateral":
        battery = 0.35 * halo + 0.65 * stepoff
        coin = 0.55 * homog + 0.45 * max(0.0, 1.0 - battery)
    else:
        battery = 0.80 * halo + 0.20 * stepoff
        coin = 0.70 * homog + 0.30 * max(0.0, 1.0 - halo)

    # Stacked coins can mimic halo — flag ambiguity
    if mimic > 0.45 or (halo > 0.45 and stepoff < 0.25 and view == "ap"):
        explanation = (
            f"Multi-ring AP pattern ({peaks} radial peaks, mimic score {mimic:.2f}). "
            "May be button battery OR stacked coins. Obtain lateral view and treat as battery until ruled out."
        )
    elif battery > 0.6:
        explanation = (
            "Radiographic features suggest button battery. Esophageal impaction is a surgical emergency — "
            "target endoscopy within 2 hours per Reese's Law clinical guidelines."
        )
    elif coin > 0.6:
        explanation = "Homogeneous disc density favors coin. Confirm with clinical history and lateral view."
    else:
        explanation = "Indeterminate disc morphology. When in doubt, manage as suspected battery."

    return HaloAnalysis(
        halo_score=halo,
        stepoff_score=stepoff,
        coin_score=float(np.clip(coin, 0, 1)),
        battery_score=float(np.clip(battery, 0, 1)),
        center=center,
        radius=radius,
        radial_profile=profile.tolist(),
        explanation=explanation,
        profile_peaks=peaks,
        stacked_mimic_score=mimic,
    )


def draw_overlay(base_gray: np.ndarray, analysis: HaloAnalysis, label: str) -> np.ndarray:
    """Return RGB overlay with bounding circle + halo ring visualization."""
    u8 = (np.clip(base_gray, 0, 1) * 255).astype(np.uint8)
    rgb = cv2.cvtColor(u8, cv2.COLOR_GRAY2RGB)
    if analysis.center is None:
        return rgb
    cx, cy = analysis.center
    is_battery = "BATTERY" in label
    color = (220, 60, 60) if is_battery else (60, 180, 90)
    # Outer detection ring
    cv2.circle(rgb, (cx, cy), analysis.radius, color, 2)
    # Inner halo ring (battery signature)
    if analysis.halo_score > 0.3:
        inner_r = int(analysis.radius * 0.72)
        cv2.circle(rgb, (cx, cy), inner_r, (100, 160, 255), 1, cv2.LINE_AA)
    cv2.circle(rgb, (cx, cy), 4, color, -1)
    label_text = label.replace("_", " ")
    cv2.putText(
        rgb, label_text,
        (max(5, cx - 90), max(22, cy - analysis.radius - 12)),
        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2, cv2.LINE_AA,
    )
    if analysis.halo_score > 0.4:
        cv2.putText(rgb, f"halo {analysis.halo_score:.2f}", (max(5, cx - 50), cy + analysis.radius + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (100, 160, 255), 1, cv2.LINE_AA)
    return rgb

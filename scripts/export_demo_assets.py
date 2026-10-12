#!/usr/bin/env python3
"""Export demo case assets for static Vercel demo (no Python backend)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "public" / "demos"
sys.path.insert(0, str(ROOT))

from haloscan.inference import get_engine  # noqa: E402
from haloscan.synthetic import generate_sample  # noqa: E402
from haloscan.visualize import numpy_to_b64  # noqa: E402


CASES = {
    "battery": (0, True),
    "coin": (1, True),  # include lateral to demonstrate dual-view collapse guard
    "stacked": (2, False),
    "normal": (3, False),
}


def gray_preview(gray: np.ndarray) -> str:
    rgb = cv2.cvtColor((gray * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
    return numpy_to_b64(rgb)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    engine = get_engine()

    for case, (label, with_lat) in CASES.items():
        ap = generate_sample(label, seed=42)
        ap_rgb = cv2.cvtColor((ap * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
        lat_rgb = None
        lat_preview = None
        if with_lat and label in (0, 1):
            lat = generate_sample(label, lateral=True, seed=43)
            lat_rgb = cv2.cvtColor((lat * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
            lat_preview = gray_preview(lat)

        result = engine.analyze(ap_rgb, lat_rgb)
        payload = result.to_dict()
        payload["inference_source"] = "prerecorded_research_demo"
        payload["synthetic_demo"] = True
        payload["scores_are_calibrated_probabilities"] = False
        payload["clinical_use"] = "not_a_diagnosis"
        payload["ap_preview"] = gray_preview(ap)
        payload["lateral_preview"] = lat_preview
        path = OUT / f"{case}.json"
        path.write_text(json.dumps(payload, indent=2))
        print(f"✓ {path.name} ({path.stat().st_size // 1024} KB)")

    meta = {
        "cases": [
            {"id": k, "title": k.replace("_", " ").title()} for k in CASES
        ],
        "version": "2.5.0",
        "note": "Prerecorded synthetic demos. Not live inference.",
    }
    (OUT / "index.json").write_text(json.dumps(meta, indent=2))
    print(f"Done → {OUT}")


if __name__ == "__main__":
    main()

"""Smoke tests — run without GPU, minimal deps."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_imports():
    from haloscan import synthetic, models, halo_analyzer, clinical, report
    assert synthetic.LABEL_NAMES
    assert models.CLASS_NAMES


def test_synthetic_shapes():
    from haloscan.synthetic import generate_sample
    for label in range(4):
        img = generate_sample(label, seed=0)
        assert img.shape[0] == img.shape[1]
        assert img.min() >= 0 and img.max() <= 1


def test_halo_analyzer():
    import cv2
    import numpy as np
    from haloscan.synthetic import generate_sample
    from haloscan.preprocess import enhance_xray
    from haloscan.halo_analyzer import analyze_halo

    bat = enhance_xray(generate_sample(0, seed=1))
    result = analyze_halo(bat, view="ap")
    assert result.center is not None
    assert result.battery_score > result.coin_score

    coin = enhance_xray(generate_sample(1, seed=2))
    result = analyze_halo(coin, view="ap")
    assert result.coin_score > result.battery_score


def test_clinical_protocol():
    from haloscan.clinical import build_protocol
    p = build_protocol(0.8, ambiguous=False, has_lateral=True)
    assert p.urgency == "CRITICAL"
    p2 = build_protocol(0.1, ambiguous=False, has_lateral=False)
    assert p2.urgency == "ROUTINE"


def test_report_generation():
    from haloscan.clinical import build_protocol
    from haloscan.halo_analyzer import HaloAnalysis
    from haloscan.result import HaloscanResult
    from haloscan.report import generate_html_report

    halo = HaloAnalysis(0.5, 0.3, 0.4, 0.6, (100, 100), 30, [0.1, 0.5, 0.8], "test", 2, 0.3)
    protocol = build_protocol(0.7, True, False)
    r = HaloscanResult(
        prediction="BATTERY", confidence=0.8, battery_probability=0.8, coin_probability=0.2,
        ambiguous=True, emergency=True, ap_halo=halo, lat_halo=None,
        explanation="test", model_probs={"battery": 0.7, "coin": 0.2, "normal": 0.1},
        cv_probs={"battery": 0.6, "coin": 0.3, "normal": 0.1}, protocol=protocol,
        radial_chart_b64="data:image/png;base64,abc", overlay_b64="data:image/png;base64,abc",
        gradcam_b64="data:image/png;base64,abc", dual_view_used=False,
    )
    html = generate_html_report(r)
    assert "Haloscan" in html and "CRITICAL" in html


def test_inference_pipeline():
    import cv2
    import numpy as np
    from haloscan.inference import get_engine
    from haloscan.synthetic import generate_sample

    engine = get_engine()

    ap = generate_sample(0, seed=11)
    lat = generate_sample(0, lateral=True, seed=12)
    bat = engine.analyze(
        cv2.cvtColor((ap * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB),
        cv2.cvtColor((lat * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB),
    )
    assert bat.emergency and bat.battery_probability >= 0.48

    coin_ap = generate_sample(1, seed=31)
    coin = engine.analyze(cv2.cvtColor((coin_ap * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB))
    assert "COIN" in coin.prediction and not coin.emergency

    stacked_ap = generate_sample(2, seed=31)
    stacked = engine.analyze(cv2.cvtColor((stacked_ap * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB))
    assert stacked.emergency or stacked.ambiguous or stacked.stacked_mimic


if __name__ == "__main__":
    tests = [
        test_imports,
        test_synthetic_shapes,
        test_halo_analyzer,
        test_clinical_protocol,
        test_report_generation,
        test_inference_pipeline,
    ]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"✓ {t.__name__}")
        except Exception as e:
            print(f"✗ {t.__name__}: {e}")
            failed += 1
    sys.exit(failed)

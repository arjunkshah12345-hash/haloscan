"""Release checks that do not need a full evaluation run."""

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi import HTTPException

from haloscan.clinical import HOTLINE, SAFETY_STATEMENT, build_protocol
from haloscan.eval_suite import wilson
from haloscan.synthetic import generate_shifted_sample


def test_wilson_interval_does_not_pretend_forty_of_forty_is_certainty():
    low, high = wilson(40, 40)
    assert high == 1.0
    assert 0.85 < low < 0.95


def test_protocol_never_gives_disposition_orders():
    for battery, coin, ambiguous in (
        (0.9, 0.1, False),
        (0.1, 0.9, False),
        (0.4, 0.4, True),
        (0.05, 0.05, False),
    ):
        protocol = build_protocol(battery, ambiguous, False, coin_prob=coin, no_disc=battery < 0.1 and coin < 0.1 and not ambiguous)
        actions = " ".join(protocol.actions).lower()
        assert "discharge" not in actions
        assert "npo" not in actions
        assert "endoscopy" not in actions
        assert "recommend discharge" in protocol.safety.lower()
        assert HOTLINE in " ".join(protocol.contacts)
        assert protocol.safety == SAFETY_STATEMENT


def test_shifted_sample_stays_in_range():
    image = generate_shifted_sample(0, seed=800_001)
    assert image.shape == (288, 288)
    assert image.dtype == np.float32
    assert float(image.min()) >= 0.0
    assert float(image.max()) <= 1.0


def _raises(status: int, fn):
    try:
        fn()
    except HTTPException as exc:
        assert exc.status_code == status, exc.status_code
        return
    raise AssertionError(f"expected HTTP {status}")


def test_decode_rejects_garbage_and_oversize():
    from api.main import MAX_UPLOAD_BYTES, decode_image_bytes

    _raises(400, lambda: decode_image_bytes(b"not an image", "image/png"))
    _raises(413, lambda: decode_image_bytes(b"x" * (MAX_UPLOAD_BYTES + 1), "image/png"))

    buf = io.BytesIO()
    Image.new("RGB", (16, 16), (20, 20, 20)).save(buf, format="PNG")
    arr = decode_image_bytes(buf.getvalue(), "image/png")
    assert arr.shape == (16, 16, 3)
    _raises(415, lambda: decode_image_bytes(buf.getvalue(), "text/html"))


def test_prerecorded_demos_are_research_readouts():
    banned = (
        "CRITICAL",
        "URGENT",
        "ROUTINE",
        "202-625-3333",
        "NPO",
        "Stat pediatric",
        "Primary pediatrician follow-up",
    )
    for name in ("battery", "coin", "stacked", "normal"):
        data = json.loads((ROOT / "website" / "public" / "demos" / f"{name}.json").read_text())
        protocol = data.get("protocol") or {}
        blob = json.dumps(protocol)
        for token in banned:
            assert token not in blob, f"{name} still contains {token}"
        assert HOTLINE in blob
        assert data.get("inference_source") == "prerecorded_research_demo"
        assert protocol.get("urgency") not in ("CRITICAL", "URGENT", "ROUTINE")


def test_legacy_metrics_do_not_claim_emory_win():
    metrics = json.loads((ROOT / "weights" / "metrics.json").read_text())
    assert metrics.get("clinical_accuracy") is False
    assert metrics.get("beats_baseline_battery_sensitivity") is False


if __name__ == "__main__":
    tests = [
        test_wilson_interval_does_not_pretend_forty_of_forty_is_certainty,
        test_protocol_never_gives_disposition_orders,
        test_shifted_sample_stays_in_range,
        test_decode_rejects_garbage_and_oversize,
        test_prerecorded_demos_are_research_readouts,
        test_legacy_metrics_do_not_claim_emory_win,
    ]
    failed = 0
    for test in tests:
        try:
            test()
            print(f"ok {test.__name__}")
        except Exception as exc:
            print(f"FAIL {test.__name__}: {exc}")
            failed += 1
    sys.exit(failed)

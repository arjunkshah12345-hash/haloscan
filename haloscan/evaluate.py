"""Legacy entry point. Prints a short synthetic summary and refuses a clinical comparison.

The full suite, including the shift set and ablations, is:

    python3 -m haloscan.eval_suite --n 40
"""

from __future__ import annotations

import json
from pathlib import Path

from haloscan.eval_suite import HOLDOUT_SEED_BASE, run_suite

# Published numbers from Rostad et al., kept only so a reader can see the study
# HaloScan is sometimes compared with. The studies are not comparable.
PUBLISHED_EMORY_2020 = {
    "source": "Rostad et al., Pediatric Radiology / SPR 2020, as cited in the original HaloScan notes",
    "battery_sensitivity": 0.81,
    "battery_specificity": 0.92,
    "coin_sensitivity": 0.83,
    "overall_accuracy": 0.88,
    "material": "228 radiographs, YOLOv2",
    "comparable_to_haloscan_synthetic_metrics": False,
}


def evaluate_on_synthetic(n: int = 40) -> dict:
    """Same-generator holdout only. Used by the API when a caller asks to recompute."""
    report = run_suite(n=n, shift_n=0, include_predictions=False, ablations=False)
    holdout = report["holdout_ensemble"]
    return {
        "clinical_accuracy": False,
        "haloscan": {
            "battery_sensitivity": holdout["battery_research_flag_sensitivity"]["rate"],
            "battery_sensitivity_wilson95": holdout["battery_research_flag_sensitivity"]["wilson95"],
            "coin_sensitivity": holdout["coin_pattern_rate"]["rate"],
            "stacked_coin_emergency_rate": holdout["stacked_research_flag_rate"]["rate"],
            "n_per_class": n,
            "seed_base": HOLDOUT_SEED_BASE,
            "what_these_mean": (
                "Synthetic research-flag rates from generate_sample. "
                "Not clinical sensitivity. Stacked-coin flagging is not battery classification accuracy."
            ),
        },
        "baseline_emory_2020": PUBLISHED_EMORY_2020,
        "beats_baseline_battery_sensitivity": False,
        "comparison_note": (
            "HaloScan's synthetic point estimate is not evidence that the system "
            "outperforms the Emory 2020 model. The images, labels, and tasks differ."
        ),
        "provenance": report["provenance"],
    }


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="/tmp/haloscan/metrics.json")
    parser.add_argument("--n", type=int, default=20)
    args = parser.parse_args()
    metrics = evaluate_on_synthetic(n=args.n)
    path = Path(args.out)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()

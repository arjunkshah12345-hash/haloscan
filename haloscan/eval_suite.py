"""Reproducible synthetic evaluation for the shipped HaloScan checkpoint.

This does not measure clinical accuracy. Training and the in-distribution
holdout are drawn from the same procedural generator. A second set applies
a documented distribution shift. Real radiographs are not in this suite.

Seeds at or above HOLDOUT_SEED_BASE are reserved for evaluation. The shipped
weights were trained without a locked seed, so this holdout is a fresh draw
from the same generator, not a file of images withheld at training time.
"""

from __future__ import annotations

import hashlib
import json
import math
import platform
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

from haloscan.synthetic import LABEL_NAMES, generate_sample, generate_shifted_sample

ROOT = Path(__file__).resolve().parent.parent
WEIGHTS = ROOT / "weights" / "haloscan.pt"

HOLDOUT_SEED_BASE = 500_000
SHIFT_SEED_BASE = 800_000

# Published point estimates in weights/metrics.json used these seeds.
# They are same-generator draws and are not a clinical test set.
LEGACY_NOTE = (
    "Legacy metrics.json used seeds 0..n-1 (battery), 2000+ (coin), and 3000+ (stacked) "
    "with emergency defined as battery_probability >= 0.5 or emergency flag. "
    "Those figures are synthetic point estimates."
)


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion."""
    if n <= 0:
        return (0.0, 0.0)
    p = k / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    margin = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (max(0.0, centre - margin), min(1.0, centre + margin))


def _rgb(gray: np.ndarray) -> np.ndarray:
    return cv2.cvtColor((np.clip(gray, 0, 1) * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)


def _sample(label: int, index: int, seed_base: int, shifted: bool, lateral: bool) -> np.ndarray:
    seed = seed_base + label * 10_000 + index + (500 if lateral else 0)
    if shifted:
        return generate_shifted_sample(label, lateral=lateral, seed=seed)
    return generate_sample(label, lateral=lateral, seed=seed)


def _predict(engine, label: int, index: int, *, seed_base: int, shifted: bool, mode: str, use_lateral: bool) -> dict:
    ap = _sample(label, index, seed_base, shifted, lateral=False)
    lat = None
    if use_lateral and label in (0, 1):
        lat = _rgb(_sample(label, index, seed_base, shifted, lateral=True))
    t0 = time.perf_counter()
    result = engine.analyze(_rgb(ap), lat, mode=mode, explain=False)
    elapsed = (time.perf_counter() - t0) * 1000
    return {
        "label": LABEL_NAMES[label],
        "label_index": label,
        "index": index,
        "prediction": result.prediction,
        "battery_probability": round(result.battery_probability, 4),
        "coin_probability": round(result.coin_probability, 4),
        "ambiguous": bool(result.ambiguous),
        "research_flag": bool(result.emergency),
        "stacked_mimic": bool(result.stacked_mimic),
        "cnn_battery": round(result.model_probs.get("battery", 0.0), 4),
        "cnn_coin": round(result.model_probs.get("coin", 0.0), 4),
        "cv_battery": round(result.cv_probs.get("battery", 0.0), 4),
        "latency_ms": round(elapsed, 2),
        "mode": mode,
        "lateral": lat is not None,
    }


def _rates(rows: list[dict]) -> dict:
    def subset(name: str) -> list[dict]:
        return [r for r in rows if r["label"] == name]

    battery = subset("battery")
    coin = subset("coin")
    stacked = subset("stacked_coins")
    normal = subset("normal")

    def flagged(group: list[dict]) -> int:
        return sum(1 for r in group if r["research_flag"])

    def coin_like(group: list[dict]) -> int:
        return sum(1 for r in group if "COIN" in r["prediction"] and not r["research_flag"] and not r["ambiguous"])

    bat_tp = flagged(battery)
    bat_n = len(battery)
    # Specificity of the battery research flag against coin and normal only.
    # Stacked coins are reported separately because flagging them is intentional.
    neg = coin + normal
    neg_fp = flagged(neg)
    coin_tp = coin_like(coin)
    stacked_flagged = flagged(stacked)
    normal_flagged = flagged(normal)

    def pack(k: int, n: int) -> dict:
        lo, hi = wilson(k, n)
        return {
            "count": k,
            "n": n,
            "rate": round(k / n, 4) if n else None,
            "wilson95": [round(lo, 4), round(hi, 4)],
        }

    # Battery-vs-rest flag, stacked excluded from the negative class.
    tp, fp, fn, tn = bat_tp, neg_fp, bat_n - bat_tp, len(neg) - neg_fp
    precision_den = tp + fp
    recall_den = tp + fn
    spec_den = tn + fp
    prec = tp / precision_den if precision_den else 0.0
    rec = tp / recall_den if recall_den else 0.0
    spec = tn / spec_den if spec_den else 0.0
    f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) else 0.0

    return {
        "battery_research_flag_sensitivity": pack(bat_tp, bat_n),
        "battery_research_flag_false_negatives": bat_n - bat_tp,
        "coin_or_normal_false_research_flags": neg_fp,
        "coin_pattern_rate": pack(coin_tp, len(coin)),
        "stacked_research_flag_rate": pack(stacked_flagged, len(stacked)),
        "normal_false_research_flag_rate": pack(normal_flagged, len(normal)),
        "battery_flag_vs_coin_and_normal": {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": tn,
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "specificity": round(spec, 4),
            "f1": round(f1, 4),
            "note": "Stacked-coin rows are excluded from this 2x2. Flagging a stack is not counted as a true battery detection.",
        },
    }


def _confusion(rows: list[dict]) -> dict:
    """Map each row to a display class. Ambiguous is its own prediction bucket."""
    classes = ["battery", "coin", "stacked_coins", "normal", "ambiguous"]

    def bucket(row: dict) -> str:
        if row["ambiguous"] or row["prediction"].startswith("AMBIGUOUS"):
            return "ambiguous"
        if "COIN" in row["prediction"]:
            return "coin"
        if "BATTERY" in row["prediction"]:
            return "battery"
        return "normal"

    labels = ["battery", "coin", "stacked_coins", "normal"]
    matrix = [[0 for _ in classes] for _ in labels]
    for row in rows:
        matrix[labels.index(row["label"])][classes.index(bucket(row))] += 1
    return {"true_labels": labels, "predicted_buckets": classes, "matrix": matrix}


def _threshold_curve(rows: list[dict]) -> list[dict]:
    battery = [r for r in rows if r["label"] == "battery"]
    neg = [r for r in rows if r["label"] in {"coin", "normal"}]
    curve = []
    for threshold in [i / 20 for i in range(1, 20)]:
        tp = sum(1 for r in battery if r["battery_probability"] >= threshold)
        fp = sum(1 for r in neg if r["battery_probability"] >= threshold)
        fn = len(battery) - tp
        tn = len(neg) - fp
        curve.append(
            {
                "threshold": threshold,
                "battery_sensitivity": round(tp / len(battery), 4) if battery else None,
                "false_positive_rate_coin_normal": round(fp / len(neg), 4) if neg else None,
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "tn": tn,
            }
        )
    return curve


def _failures(rows: list[dict], limit: int = 12) -> list[dict]:
    bad = []
    for row in rows:
        missed_battery = row["label"] == "battery" and not row["research_flag"]
        false_coin = row["label"] == "coin" and (row["research_flag"] or "COIN" not in row["prediction"])
        missed_stack = row["label"] == "stacked_coins" and not row["research_flag"] and not row["ambiguous"]
        false_normal = row["label"] == "normal" and row["research_flag"]
        if missed_battery or false_coin or missed_stack or false_normal:
            kind = (
                "missed_battery"
                if missed_battery
                else "coin_not_called_coin"
                if false_coin
                else "stack_not_flagged"
                if missed_stack
                else "normal_flagged"
            )
            item = dict(row)
            item["failure"] = kind
            bad.append(item)
    return bad[:limit]


def _git_commit() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return "unknown"


def _weights_sha256() -> str:
    if not WEIGHTS.exists():
        return "missing"
    digest = hashlib.sha256()
    with WEIGHTS.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run_suite(
    n: int = 40,
    shift_n: int | None = None,
    include_predictions: bool = True,
    ablations: bool = True,
) -> dict:
    from haloscan.inference import get_engine

    engine = get_engine()
    shift_n = n if shift_n is None else shift_n

    def collect(seed_base: int, count: int, shifted: bool, mode: str, use_lateral: bool) -> list[dict]:
        rows = []
        for label in range(4):
            for index in range(count):
                rows.append(
                    _predict(
                        engine,
                        label,
                        index,
                        seed_base=seed_base,
                        shifted=shifted,
                        mode=mode,
                        use_lateral=use_lateral,
                    )
                )
        return rows

    holdout = collect(HOLDOUT_SEED_BASE, n, False, "ensemble", True)
    shifted = collect(SHIFT_SEED_BASE, shift_n, True, "ensemble", True)

    ablation_rows = []
    configs = [
        ("cnn_only", "cnn", True),
        ("cv_only", "cv", True),
        ("full_ensemble", "ensemble", True),
        ("ap_only", "ensemble", False),
        ("ap_plus_lateral", "ensemble", True),
        ("ensemble_without_ambiguity_heuristics", "no_ambiguity", True),
    ]
    # Reuse holdout rows for full_ensemble and ap_plus_lateral (identical settings).
    if ablations:
        configs_to_run = configs
    else:
        configs_to_run = []
    for name, mode, lateral in configs_to_run:
        if name in {"full_ensemble", "ap_plus_lateral"}:
            rows = holdout
        elif name == "ap_only":
            rows = collect(HOLDOUT_SEED_BASE, n, False, "ensemble", False)
        else:
            rows = collect(HOLDOUT_SEED_BASE, n, False, mode, lateral)
        summary = _rates(rows)
        summary["name"] = name
        if name == "ap_plus_lateral":
            summary["note"] = "Same settings as full_ensemble: dual-view fusion plus ambiguity rules."
        summary["mode"] = mode
        summary["lateral"] = lateral
        summary["n_per_class"] = n
        ablation_rows.append(summary)

    latencies = [r["latency_ms"] for r in holdout]
    latencies_sorted = sorted(latencies)

    def pct(p: float) -> float:
        if not latencies_sorted:
            return 0.0
        idx = min(len(latencies_sorted) - 1, max(0, int(round(p * (len(latencies_sorted) - 1)))))
        return round(latencies_sorted[idx], 2)

    # One explained pass so latency includes Grad-CAM, separate from the suite timing.
    explain_ms = None
    try:
        ap = _rgb(generate_sample(0, seed=HOLDOUT_SEED_BASE))
        t0 = time.perf_counter()
        engine.analyze(ap, explain=True)
        explain_ms = round((time.perf_counter() - t0) * 1000, 2)
    except Exception:
        explain_ms = None

    report = {
        "title": "HaloScan synthetic evaluation",
        "clinical_accuracy": False,
        "disclaimer": (
            "All numbers below are from a procedural X-ray generator. "
            "They are not clinical sensitivity, not a reader study, and not a comparison "
            "that shows HaloScan outperforming the Emory 2020 radiograph model. "
            "A research flag is not a diagnosis and must not be used to discharge or to delay emergency care."
        ),
        "definitions": {
            "battery_research_flag_sensitivity": "Fraction of synthetic battery images on which the research flag is raised. Not clinical sensitivity.",
            "coin_pattern_rate": "Fraction of synthetic single-coin images called coin-like, without the research flag and without the ambiguity rewrite.",
            "stacked_research_flag_rate": "Fraction of synthetic stacked-coin images on which the research flag or ambiguity path fires. Reported separately from battery classification.",
            "wilson95": "Wilson score 95% interval. A point estimate of 1.0 on a small n still has a lower bound below 1.",
            "threshold_curve": "Battery-like score threshold on the ensemble's normalized battery score, not the ambiguity rules.",
            "training_label_collapse": "classifier.build_dataset maps stacked coins to the battery class (0). The CNN is trained to call stacks batteries. That is not an independent stacked-coin detector.",
        },
        "dataset": {
            "generator": "haloscan/synthetic.py",
            "holdout_seed_base": HOLDOUT_SEED_BASE,
            "shift_seed_base": SHIFT_SEED_BASE,
            "holdout_n_per_class": n,
            "shift_n_per_class": shift_n,
            "classes": LABEL_NAMES,
            "holdout_description": "Fresh generate_sample draws. Same painter as training: concentric rings for batteries, flat discs for coins, copied rings plus an offset rim for stacks, stick-figure ribs for background.",
            "shift_description": "generate_shifted_sample: smaller frame, edge-biased placement, gamma, JPEG quality 30-55, extra noise, and a dark bar.",
            "pairing": (
                "AP and lateral are separate random draws with related seeds, not a projective pair of one object. "
                "On the 2026-10-11 holdout, attaching those laterals made the dual-view CNN call every synthetic coin a battery "
                "(coin-pattern rate 0.0 with a lateral, 1.0 on the same AP images without one). "
                "The previously published 100% coin figure is not reproduced under this paired protocol."
            ),
            "leakage": (
                "The shipped checkpoint was fit by build_dataset without a fixed seed, so exact image identity "
                "with this holdout is unlikely, but the images come from the same generator family. "
                "This is not a locked unused split from the original training run."
            ),
            "legacy_metrics_note": LEGACY_NOTE,
            "real_radiographs": "No appropriately licensed de-identified pediatric foreign-body set was available in this repository. No external clinical evaluation was run.",
        },
        "holdout_ensemble": {
            **_rates(holdout),
            "confusion": _confusion(holdout),
            "threshold_curve": _threshold_curve(holdout),
            "failures": _failures(holdout),
            "n_per_class": n,
        },
        "shifted_ensemble": {
            **_rates(shifted),
            "confusion": _confusion(shifted),
            "failures": _failures(shifted),
            "n_per_class": shift_n,
        },
        "ablations": ablation_rows,
        "latency_ms": {
            "device": "cpu" if not __import__("torch").cuda.is_available() else "cuda",
            "explain_false_p50": pct(0.50),
            "explain_false_p95": pct(0.95),
            "explain_true_one_sample": explain_ms,
            "n_timed": len(latencies),
            "note": "explain=False skips Grad-CAM and chart rendering. The one-sample figure includes them.",
        },
        "provenance": {
            "evaluated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "git_commit": _git_commit(),
            "weights_path": "weights/haloscan.pt",
            "weights_sha256": _weights_sha256(),
            "python": platform.python_version(),
            "platform": platform.platform(),
            "processor": platform.processor() or platform.machine(),
        },
    }
    if include_predictions:
        report["holdout_predictions"] = holdout
        report["shifted_predictions"] = shifted
    return report


def write_ablation_chart(report: dict, path: Path) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    names = []
    battery = []
    coin = []
    stacked = []
    for row in report["ablations"]:
        names.append(row["name"].replace("_", "\n"))
        battery.append(row["battery_research_flag_sensitivity"]["rate"] or 0)
        coin.append(row["coin_pattern_rate"]["rate"] or 0)
        stacked.append(row["stacked_research_flag_rate"]["rate"] or 0)

    x = np.arange(len(names))
    width = 0.25
    fig, ax = plt.subplots(figsize=(10.2, 4.6), dpi=140)
    fig.patch.set_facecolor("#16181d")
    ax.set_facecolor("#16181d")
    ax.bar(x - width, battery, width, label="Battery flag", color="#c47b4a")
    ax.bar(x, coin, width, label="Coin pattern", color="#d6c7a1")
    ax.bar(x + width, stacked, width, label="Stack flagged", color="#8d99ae")
    ax.set_ylim(0, 1.05)
    ax.set_xticks(x)
    ax.set_xticklabels(names, color="#e7e4dc", fontsize=8)
    ax.tick_params(colors="#e7e4dc")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#3a3f48")
    ax.spines["bottom"].set_color("#3a3f48")
    ax.set_ylabel("Rate on synthetic holdout", color="#e7e4dc")
    ax.set_title("Same synthetic images. Not clinical accuracy.", color="#e7e4dc", loc="left", fontsize=12)
    legend = ax.legend(frameon=False)
    for text in legend.get_texts():
        text.set_color("#e7e4dc")
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path)
    plt.close(fig)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Run the HaloScan synthetic evaluation suite")
    parser.add_argument("--n", type=int, default=40)
    parser.add_argument("--shift-n", type=int, default=None)
    parser.add_argument("--out", default=str(ROOT / "docs" / "eval" / "eval_report.json"))
    args = parser.parse_args()
    report = run_suite(n=args.n, shift_n=args.shift_n)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2))
    chart = out.parent / "ablation.png"
    write_ablation_chart(report, chart)
    public_chart = ROOT / "website" / "public" / "figures" / "validation" / "ablation.png"
    write_ablation_chart(report, public_chart)
    public_json = ROOT / "website" / "public" / "figures" / "validation" / "eval_report.json"
    # The website does not need every raw row twice if the docs copy has them,
    # but the page is static and should carry the summary. Keep predictions so
    # a reviewer can inspect failures without rerunning.
    public_json.write_text(json.dumps(report, indent=2))
    summary = {
        "clinical_accuracy": False,
        "holdout_battery_flag": report["holdout_ensemble"]["battery_research_flag_sensitivity"],
        "holdout_coin_pattern": report["holdout_ensemble"]["coin_pattern_rate"],
        "holdout_stacked_flag": report["holdout_ensemble"]["stacked_research_flag_rate"],
        "shift_battery_flag": report["shifted_ensemble"]["battery_research_flag_sensitivity"],
        "weights_sha256": report["provenance"]["weights_sha256"],
        "git_commit": report["provenance"]["git_commit"],
        "evaluated_at": report["provenance"]["evaluated_at"],
        "full_report": str(out.relative_to(ROOT)),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

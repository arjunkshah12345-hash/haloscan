#!/usr/bin/env python3
"""Export benchmark charts and validation data for the marketing site."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "public" / "figures" / "validation"
sys.path.insert(0, str(ROOT))

from haloscan.evaluate import evaluate_on_synthetic  # noqa: E402
from haloscan.inference import get_engine  # noqa: E402
from haloscan.synthetic import generate_sample  # noqa: E402

import cv2  # noqa: E402

# Publication-style matplotlib defaults
plt.rcParams.update(
    {
        "font.family": "serif",
        "font.serif": ["Times New Roman", "Times", "DejaVu Serif"],
        "font.size": 11,
        "axes.labelsize": 12,
        "axes.titlesize": 13,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "axes.edgecolor": "#333333",
        "axes.grid": False,
        "savefig.facecolor": "white",
        "savefig.dpi": 150,
    }
)


def benchmark_chart(metrics: dict, path: Path) -> None:
    labels = ["Battery\nsensitivity", "Coin\nsensitivity", "Stacked-coin\nemergency catch"]
    haloscan = [
        metrics["haloscan"]["battery_sensitivity"] * 100,
        metrics["haloscan"]["coin_sensitivity"] * 100,
        metrics["haloscan"]["stacked_coin_emergency_rate"] * 100,
    ]
    emory = [
        metrics["baseline_emory_2020"]["battery_sensitivity"] * 100,
        metrics["baseline_emory_2020"]["coin_sensitivity"] * 100,
        0,
    ]

    x = np.arange(len(labels))
    w = 0.35
    fig, ax = plt.subplots(figsize=(7, 4.2))
    ax.bar(x - w / 2, haloscan, w, label="Haloscan", color="#111111", edgecolor="#333")
    ax.bar(x + w / 2, emory, w, label="Emory 2020 baseline", color="#aaaaaa", edgecolor="#666")
    ax.set_ylabel("Percent (%)")
    ax.set_title("Figure 4. Benchmark comparison — synthetic holdout")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 110)
    ax.legend(frameon=True, loc="upper right")
    for i, v in enumerate(haloscan):
        ax.text(i - w / 2, v + 2, f"{v:.0f}%", ha="center", fontsize=10)
    for i, v in enumerate(emory):
        if v > 0:
            ax.text(i + w / 2, v + 2, f"{v:.0f}%", ha="center", fontsize=10)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)


def confusion_matrix_chart(n: int, path: Path) -> dict:
    """4-class confusion on synthetic samples."""
    engine = get_engine()
    classes = ["Battery", "Coin", "Stacked", "Normal"]
    matrix = np.zeros((4, 4), dtype=int)

    seeds = {0: range(n), 1: range(2000, 2000 + n), 2: range(3000, 3000 + n), 3: range(4000, 4000 + n)}

    for true_i, seed_range in seeds.items():
        for seed in seed_range:
            ap = generate_sample(true_i, seed=seed)
            rgb = cv2.cvtColor((ap * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
            lat = None
            if true_i == 0:
                lat = cv2.cvtColor(
                    (generate_sample(0, lateral=True, seed=seed + 1000) * 255).astype(np.uint8),
                    cv2.COLOR_GRAY2RGB,
                )
            r = engine.analyze(rgb, lat)
            pred = r.prediction.upper()
            if "BATTERY" in pred or r.emergency:
                pred_i = 0
            elif "STACK" in pred:
                pred_i = 2
            elif "NORMAL" in pred or "NO" in pred:
                pred_i = 3
            else:
                pred_i = 1
            matrix[true_i, pred_i] += 1

    fig, ax = plt.subplots(figsize=(5.5, 4.8))
    im = ax.imshow(matrix, cmap="Greys", vmin=0)
    ax.set_xticks(range(4))
    ax.set_yticks(range(4))
    ax.set_xticklabels(classes, rotation=35, ha="right")
    ax.set_yticklabels(classes)
    ax.set_xlabel("Predicted class")
    ax.set_ylabel("True class")
    ax.set_title("Figure 5. Confusion matrix (n=40 per class)")
    for i in range(4):
        for j in range(4):
            color = "white" if matrix[i, j] > matrix.max() * 0.55 else "black"
            ax.text(j, i, str(matrix[i, j]), ha="center", va="center", color=color, fontsize=11)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)

    return {"classes": classes, "matrix": matrix.tolist(), "n_per_class": n}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    n = 40
    metrics = evaluate_on_synthetic(n=n)
    (OUT / "metrics.json").write_text(json.dumps(metrics, indent=2))

    benchmark_chart(metrics, OUT / "benchmark.png")
    cm = confusion_matrix_chart(n, OUT / "confusion_matrix.png")

    smoke_tests = [
        {"name": "test_imports", "desc": "Core package imports"},
        {"name": "test_synthetic_shapes", "desc": "Synthetic radiograph generator"},
        {"name": "test_halo_analyzer", "desc": "CV halo scoring (battery vs coin)"},
        {"name": "test_clinical_protocol", "desc": "CRITICAL / ROUTINE protocol engine"},
        {"name": "test_report_generation", "desc": "HTML clinical report export"},
        {"name": "test_inference_pipeline", "desc": "Full battery / coin / stacked inference on synthetic cases"},
    ]

    payload = {
        "metrics": metrics,
        "confusion_matrix": cm,
        "smoke_tests": smoke_tests,
        "ci_workflow": "Haloscan Tests (.github/workflows/test.yml)",
        "eval_command": "python3 -m haloscan.evaluate --n 40",
    }
    (OUT / "report.json").write_text(json.dumps(payload, indent=2))
    print(f"✓ metrics → {OUT / 'metrics.json'}")
    print(f"✓ benchmark.png, confusion_matrix.png")
    print(f"✓ report.json")


if __name__ == "__main__":
    main()

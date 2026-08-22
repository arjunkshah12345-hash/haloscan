#!/usr/bin/env python3
"""Export methodology figures: class samples, radial comparison, training pipeline."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "website" / "public" / "figures" / "methodology"
sys.path.insert(0, str(ROOT))

from haloscan.halo_analyzer import analyze_halo  # noqa: E402
from haloscan.preprocess import enhance_xray  # noqa: E402
from haloscan.synthetic import generate_sample  # noqa: E402

plt.rcParams.update(
    {
        "font.family": "serif",
        "font.serif": ["Times New Roman", "Times", "DejaVu Serif"],
        "font.size": 11,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "savefig.facecolor": "white",
        "savefig.dpi": 150,
    }
)

CLASSES = [
    (0, "Button battery", "Double halo on AP"),
    (1, "Single coin", "Homogeneous disc"),
    (2, "Stacked coins", "False halo mimic"),
    (3, "Normal study", "No foreign body"),
]


def class_samples(path: Path) -> None:
    fig, axes = plt.subplots(2, 2, figsize=(7, 7))
    for ax, (label, title, note) in zip(axes.flat, CLASSES):
        img = generate_sample(label, seed=42 + label)
        ax.imshow(img, cmap="gray", vmin=0, vmax=1)
        ax.set_title(f"{title}\n{note}", fontsize=12)
        ax.axis("off")
    fig.suptitle("Figure 6. Synthetic training classes (AP projection)", fontsize=13, y=1.02)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)


def radial_comparison(path: Path) -> dict:
    specs = [
        (0, "Battery", "#111111", 42),
        (1, "Coin", "#666666", 43),
        (2, "Stacked coins", "#999999", 44),
    ]
    fig, ax = plt.subplots(figsize=(7, 4))
    meta: list[dict] = []
    for label, name, color, seed in specs:
        ap = enhance_xray(generate_sample(label, seed=seed))
        result = analyze_halo(ap, view="ap")
        profile = result.radial_profile
        if not profile:
            continue
        x = np.arange(len(profile))
        ax.plot(x, profile, label=f"{name} (halo={result.halo_score:.2f})", color=color, linewidth=2)
        meta.append({"class": name, "halo_score": round(result.halo_score, 3), "battery_score": round(result.battery_score, 3)})
    ax.set_xlabel("Normalized radius (disc center → edge)")
    ax.set_ylabel("Mean intensity (normalized)")
    ax.set_title("Figure 7. Radial intensity profiles — CV branch input")
    ax.legend(frameon=True, loc="upper right", fontsize=10)
    ax.grid(True, alpha=0.25, linestyle="--")
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    return {"profiles": meta}


def training_pipeline(path: Path) -> None:
    fig, ax = plt.subplots(figsize=(9, 2.8))
    ax.set_xlim(0, 9)
    ax.set_ylim(0, 1)
    ax.axis("off")
    steps = [
        ("1. Synthetic\ngenerator", "No PHI · 4 classes"),
        ("2. Kaggle GPU\ntraining", "DualViewNet · 20 epochs"),
        ("3. Battery-weighted\nloss", "3× penalty on misses"),
        ("4. Export weights", "haloscan.pt · metrics.json"),
        ("5. Bundled\ndeploy", "Render API · Vercel UI"),
    ]
    for i, (title, sub) in enumerate(steps):
        x = 0.4 + i * 1.75
        rect = plt.Rectangle((x, 0.25), 1.45, 0.55, fill=True, facecolor="#f7f7f7", edgecolor="#111", linewidth=1.2)
        ax.add_patch(rect)
        ax.text(x + 0.725, 0.62, title, ha="center", va="center", fontsize=10, fontweight="bold")
        ax.text(x + 0.725, 0.38, sub, ha="center", va="center", fontsize=9, color="#444")
        if i < len(steps) - 1:
            ax.annotate("", xy=(x + 1.55, 0.52), xytext=(x + 1.45, 0.52), arrowprops=dict(arrowstyle="->", color="#111"))
    ax.set_title("Figure 8. Training and deployment pipeline", fontsize=13, pad=12)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)


def decision_flow(path: Path) -> None:
    """Clinical decision flowchart."""
    fig, ax = plt.subplots(figsize=(6.5, 5.5))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")

    def box(x, y, w, h, text, fill="#f7f7f7"):
        rect = plt.Rectangle((x, y), w, h, fill=True, facecolor=fill, edgecolor="#111", linewidth=1.2)
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=10, wrap=True)

    box(3.2, 8.8, 3.6, 0.9, "Pediatric chest X-ray\n(disc-shaped opacity?)")
    box(1, 6.8, 3, 0.9, "Haloscan\nensemble")
    box(6, 6.8, 3, 0.9, "Human\nradiologist read")
    box(0.5, 4.5, 2.2, 0.8, "Battery prob\n≥ 0.55", fill="#fdf0f0")
    box(3.3, 4.5, 2.2, 0.8, "Ambiguous\nhalo", fill="#fdf8f0")
    box(6.2, 4.5, 2.2, 0.8, "Coin / low\nrisk", fill="#f0f8f0")
    box(0.3, 2.2, 2.6, 0.9, "CRITICAL\n2-hr endoscopy", fill="#fdf0f0")
    box(3.1, 2.2, 2.6, 0.9, "CRITICAL\n(conservative)", fill="#fdf0f0")
    box(6.1, 2.2, 2.6, 0.9, "ROUTINE\nobservation", fill="#f0f8f0")

    for x1, y1, x2, y2 in [
        (5, 8.8, 2.5, 7.7),
        (5, 8.8, 7.5, 7.7),
        (2.5, 6.8, 1.6, 5.3),
        (2.5, 6.8, 4.4, 5.3),
        (2.5, 6.8, 7.3, 5.3),
        (1.6, 4.5, 1.6, 3.1),
        (4.4, 4.5, 4.4, 3.1),
        (7.3, 4.5, 7.3, 3.1),
    ]:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color="#333"))

    ax.set_title("Figure 9. Clinical decision flow (decision support)", fontsize=13, pad=8)
    fig.tight_layout()
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    class_samples(OUT / "class_samples.png")
    radial_meta = radial_comparison(OUT / "radial_comparison.png")
    training_pipeline(OUT / "training_pipeline.png")
    decision_flow(OUT / "decision_flow.png")

    payload = {
        "classes": [{"label": t, "note": n} for _, t, n in CLASSES],
        "radial": radial_meta,
        "export_script": "scripts/export_methodology_figures.py",
    }
    (OUT / "report.json").write_text(json.dumps(payload, indent=2))
    print(f"✓ methodology figures → {OUT}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Render a 3Blue1Brown-style Haloscan explainer video (matplotlib + ffmpeg)."""
from __future__ import annotations

import math
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from matplotlib.animation import FFMpegWriter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "renders"
NARRATION = Path(__file__).with_name("explainer_narration.txt")

# 3Blue1Brown-ish palette
BG = "#0f0f1a"
GRID = "#1e1e32"
TEXT = "#e8e8f0"
MUTED = "#8888aa"
YELLOW = "#ffe066"
BLUE = "#58a6ff"
TEAL = "#4ecdc4"
RED = "#ff6b6b"
WHITE = "#ffffff"

W, H = 1280, 720
FPS = 15


def get_audio_duration(wav_path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(wav_path),
        ],
        text=True,
    )
    return float(out.strip())


def scaled_scenes(duration: float) -> list[Scene]:
    base = SCENES[-1].end
    scale = duration / base
    return [Scene(s.start * scale, s.end * scale, s.draw) for s in SCENES]


@dataclass
class Scene:
    start: float  # seconds
    end: float
    draw: str  # scene id


SCENES = [
    Scene(0, 8, "title"),
    Scene(8, 22, "problem"),
    Scene(22, 38, "xray_disc"),
    Scene(38, 54, "double_halo"),
    Scene(54, 70, "stacked_trap"),
    Scene(70, 82, "reeses_law"),
    Scene(82, 96, "gap"),
    Scene(96, 118, "architecture"),
    Scene(118, 132, "radial"),
    Scene(132, 148, "results"),
    Scene(148, 158, "close"),
]

DURATION = SCENES[-1].end


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * ease(t)


def setup_ax():
    fig, ax = plt.subplots(figsize=(W / 100, H / 100), dpi=100)
    fig.patch.set_facecolor(BG)
    ax.set_facecolor(BG)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 9)
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def draw_grid(ax, alpha=0.35):
    for x in np.arange(0, 16.1, 0.8):
        ax.plot([x, x], [0, 9], color=GRID, lw=0.4, alpha=alpha, zorder=0)
    for y in np.arange(0, 9.1, 0.8):
        ax.plot([0, 16], [y, y], color=GRID, lw=0.4, alpha=alpha, zorder=0)


def caption(ax, text: str, y=0.55, size=22, color=TEXT, alpha=1.0):
    ax.text(8, y, text, ha="center", va="center", fontsize=size, color=color, alpha=alpha, wrap=True)


def scene_title(ax, t: float):
    draw_grid(ax)
    op = lerp(0, 1, t / 0.4) if t < 0.4 else 1.0
    caption(ax, "Haloscan", y=5.2, size=52, color=YELLOW, alpha=op)
    caption(ax, "The diagnosis Congress didn't solve", y=4.0, size=26, color=TEXT, alpha=op * 0.95)
    caption(ax, "Pediatric X-ray · Button battery vs coin", y=3.0, size=18, color=MUTED, alpha=op * 0.8)


def scene_problem(ax, t: float):
    draw_grid(ax)
    caption(ax, "A child swallows something round.", y=7.6, size=24, color=TEXT)
    # Simple child + disc icon
    head = patches.Circle((4.2, 4.8), 0.55, fill=False, ec=TEXT, lw=2)
    body = patches.FancyBboxPatch((3.55, 2.8), 1.3, 1.6, boxstyle="round,pad=0.02", fill=False, ec=TEXT, lw=2)
    ax.add_patch(head)
    ax.add_patch(body)
    disc_op = ease(min(1, max(0, (t - 0.15) / 0.35)))
    disc = patches.Circle((4.2, 3.5), 0.18, fc=YELLOW, ec=WHITE, lw=1.5, alpha=disc_op)
    ax.add_patch(disc)
    caption(ax, "Battery or coin?", y=1.6, size=30, color=YELLOW, alpha=disc_op)
    if t > 0.45:
        caption(ax, "~2 hour esophageal emergency window", y=0.9, size=17, color=RED, alpha=ease((t - 0.45) / 0.3))


def draw_xray_disc(ax, cx, cy, r, kind: str, t: float, label: str):
    """kind: battery | coin | stacked"""
    glow = patches.Circle((cx, cy), r * 1.15, fc="#ffffff", alpha=0.06)
    ax.add_patch(glow)
    disc = patches.Circle((cx, cy), r, fc="#dfe6f0", ec=WHITE, lw=1.5, alpha=lerp(0, 1, t))
    ax.add_patch(disc)
    if kind == "battery" and t > 0.2:
        ht = ease(min(1, (t - 0.2) / 0.5))
        for ring_r, col in [(r * 0.72, YELLOW), (r * 0.45, TEAL)]:
            ring = patches.Circle((cx, cy), ring_r, fill=False, ec=col, lw=2.5, alpha=ht)
            ax.add_patch(ring)
        ax.text(cx, cy - r - 0.45, label, ha="center", fontsize=16, color=YELLOW, alpha=ht)
    elif kind == "coin":
        ht = ease(min(1, t / 0.4))
        ax.text(cx, cy - r - 0.45, label, ha="center", fontsize=16, color=BLUE, alpha=ht)
    elif kind == "stacked":
        ht = ease(min(1, (t - 0.15) / 0.45))
        ring = patches.Circle((cx, cy), r * 0.55, fill=False, ec=YELLOW, lw=2, alpha=ht * 0.85)
        ax.add_patch(ring)
        ax.text(cx, cy - r - 0.45, label, ha="center", fontsize=16, color=RED, alpha=ht)


def scene_xray_disc(ax, t: float):
    draw_grid(ax)
    caption(ax, "On X-ray, both look like bright discs", y=7.8, size=22, color=TEXT)
    draw_xray_disc(ax, 5.2, 4.2, 1.1, "battery", t, "Button battery")
    if t > 0.35:
        draw_xray_disc(ax, 10.8, 4.2, 1.1, "coin", ease(min(1, (t - 0.35) / 0.35)), "Coin")


def scene_double_halo(ax, t: float):
    draw_grid(ax)
    caption(ax, 'The "double halo sign"', y=7.7, size=24, color=YELLOW)
    cx, cy, r = 8, 4.3, 1.35
    disc = patches.Circle((cx, cy), r, fc="#dfe6f0", ec=WHITE, lw=1.5)
    ax.add_patch(disc)
    ht = ease(min(1, t / 0.55))
    for ring_r, col, lbl in [(r * 0.78, YELLOW, "outer rim"), (r * 0.48, TEAL, "inner ring")]:
        ring = patches.Circle((cx, cy), ring_r, fill=False, ec=col, lw=3, alpha=ht)
        ax.add_patch(ring)
        ang = math.pi * 0.75
        ax.annotate(
            lbl,
            xy=(cx + ring_r * math.cos(ang), cy + ring_r * math.sin(ang)),
            xytext=(cx + 2.8, cy + 1.8),
            arrowprops=dict(arrowstyle="->", color=col, lw=1.5),
            fontsize=14,
            color=col,
            alpha=ht,
        )
    if t > 0.5:
        caption(ax, "Classic button battery signature", y=1.2, size=18, color=MUTED, alpha=ease((t - 0.5) / 0.3))


def scene_stacked_trap(ax, t: float):
    draw_grid(ax)
    caption(ax, "The trap: stacked coins", y=7.7, size=24, color=RED)
    cx, cy, r = 8, 4.3, 1.25
    disc = patches.Circle((cx, cy), r, fc="#dfe6f0", ec=WHITE, lw=1.5)
    ax.add_patch(disc)
    ht = ease(min(1, t / 0.5))
    ring = patches.Circle((cx, cy), r * 0.58, fill=False, ec=YELLOW, lw=2.5, alpha=ht)
    ax.add_patch(ring)
    # offset second coin ghost
    ghost = patches.Circle((cx + 0.12, cy + 0.1), r * 0.92, fill=False, ec=MUTED, lw=1.5, linestyle="--", alpha=ht * 0.7)
    ax.add_patch(ghost)
    if t > 0.35:
        caption(ax, "Looks like battery halo → false reassurance", y=1.4, size=19, color=RED, alpha=ease((t - 0.35) / 0.35))
        caption(ax, "Haloscan: treat as battery anyway", y=0.7, size=17, color=YELLOW, alpha=ease((t - 0.45) / 0.35))


def scene_reeses_law(ax, t: float):
    draw_grid(ax)
    caption(ax, "Reese's Law · 2022", y=7.6, size=26, color=YELLOW)
    ht = ease(min(1, t / 0.45))
    ax.text(8, 4.8, "409", ha="center", va="center", fontsize=96, color=TEAL, alpha=ht, fontweight="bold")
    ax.text(8, 3.5, "— 2 —", ha="center", va="center", fontsize=36, color=MUTED, alpha=ht)
    if t > 0.3:
        caption(ax, "Child-proof battery packaging", y=2.0, size=20, color=TEXT, alpha=ease((t - 0.3) / 0.35))
        caption(
            ax,
            "Prevention yes · Diagnosis no",
            y=1.0,
            size=22,
            color=RED if t > 0.55 else MUTED,
            alpha=ease(max(0, (t - 0.4) / 0.35)),
        )


def scene_gap(ax, t: float):
    draw_grid(ax)
    caption(ax, "Haloscan closes the diagnostic gap", y=7.5, size=26, color=YELLOW, alpha=ease(min(1, t / 0.3)))
    boxes = [
        (2.2, 4.5, "ER physician", "Battery or coin?\n2 AM. No pediatric\nradiologist."),
        (6.5, 4.5, "Haloscan", "CV + AI fusion\nExplainable output\nSafety-first bias"),
        (10.8, 4.5, "Protocol", "CRITICAL / URGENT\n/ ROUTINE\n+ hotlines"),
    ]
    for i, (x, y, title, body) in enumerate(boxes):
        delay = 0.15 + i * 0.12
        ht = ease(min(1, max(0, (t - delay) / 0.35)))
        rect = patches.FancyBboxPatch((x - 1.5, y - 1.3), 3, 2.6, boxstyle="round,pad=0.08", fc="#161625", ec=BLUE if i == 1 else MUTED, lw=2 if i == 1 else 1.2, alpha=ht)
        ax.add_patch(rect)
        ax.text(x, y + 0.85, title, ha="center", fontsize=15, color=YELLOW if i == 1 else TEXT, alpha=ht, fontweight="bold")
        ax.text(x, y - 0.15, body, ha="center", va="center", fontsize=11, color=MUTED, alpha=ht, linespacing=1.4)
        if i < 2 and t > delay + 0.25:
            ax.annotate("", xy=(boxes[i + 1][0] - 1.55, y), xytext=(x + 1.55, y), arrowprops=dict(arrowstyle="->", color=TEAL, lw=2), alpha=ht)


def scene_architecture(ax, t: float):
    draw_grid(ax)
    caption(ax, "Dual-branch ensemble", y=7.7, size=24, color=TEXT)
    # AP input
    rect = patches.FancyBboxPatch((0.8, 3.2), 2.2, 1.4, boxstyle="round,pad=0.05", fc="#161625", ec=MUTED, lw=1.5)
    ax.add_patch(rect)
    ax.text(1.9, 3.9, "AP X-ray", ha="center", fontsize=13, color=TEXT)
    # CV branch
    ht1 = ease(min(1, t / 0.35))
    cv = patches.FancyBboxPatch((3.8, 5.0), 3.2, 1.5, boxstyle="round,pad=0.05", fc="#161625", ec=TEAL, lw=2, alpha=ht1)
    ax.add_patch(cv)
    ax.text(5.4, 5.75, "Radial halo profiler", ha="center", fontsize=13, color=TEAL, alpha=ht1)
    ax.text(5.4, 5.35, "OpenCV · physics", ha="center", fontsize=11, color=MUTED, alpha=ht1)
    # CNN branch
    ht2 = ease(min(1, max(0, (t - 0.15) / 0.35)))
    cnn = patches.FancyBboxPatch((3.8, 2.0), 3.2, 1.5, boxstyle="round,pad=0.05", fc="#161625", ec=BLUE, lw=2, alpha=ht2)
    ax.add_patch(cnn)
    ax.text(5.4, 2.75, "DualViewNet", ha="center", fontsize=13, color=BLUE, alpha=ht2)
    ax.text(5.4, 2.35, "PyTorch · dual view", ha="center", fontsize=11, color=MUTED, alpha=ht2)
    # Fusion
    ht3 = ease(min(1, max(0, (t - 0.35) / 0.35)))
    fus = patches.FancyBboxPatch((8.2, 3.2), 2.6, 1.8, boxstyle="round,pad=0.05", fc="#161625", ec=YELLOW, lw=2, alpha=ht3)
    ax.add_patch(fus)
    ax.text(9.5, 4.3, "Ensemble", ha="center", fontsize=14, color=YELLOW, alpha=ht3, fontweight="bold")
    ax.text(9.5, 3.75, "55% CV + 40% CNN", ha="center", fontsize=11, color=MUTED, alpha=ht3)
    # Output
    ht4 = ease(min(1, max(0, (t - 0.5) / 0.35)))
    out = patches.FancyBboxPatch((11.8, 3.0), 3.2, 2.2, boxstyle="round,pad=0.05", fc="#161625", ec=RED, lw=2, alpha=ht4)
    ax.add_patch(out)
    ax.text(13.4, 4.5, "CRITICAL if", ha="center", fontsize=12, color=RED, alpha=ht4)
    ax.text(13.4, 4.0, "ambiguous halo", ha="center", fontsize=12, color=RED, alpha=ht4)
    ax.text(13.4, 3.4, "+ Grad-CAM", ha="center", fontsize=11, color=MUTED, alpha=ht4)
    for x1, y1, x2, y2, ht in [
        (3.0, 3.9, 3.8, 5.5, ht1),
        (3.0, 3.7, 3.8, 2.8, ht2),
        (7.0, 5.5, 8.2, 4.3, ht3),
        (7.0, 2.8, 8.2, 3.9, ht3),
        (10.8, 4.1, 11.8, 4.1, ht4),
    ]:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.5), alpha=ht)


def scene_radial(ax, t: float):
    draw_grid(ax)
    caption(ax, "Radial intensity profile", y=7.7, size=24, color=TEAL)
    inset = ax.inset_axes([0.12, 0.12, 0.76, 0.58])
    inset.set_facecolor("#12121f")
    x = np.linspace(0, 1, 40)
    battery = 0.3 + 0.5 * np.sin(6 * np.pi * x) ** 2 + 0.2 * x
    coin = 0.25 + 0.65 * x
    stacked = 0.28 + 0.35 * np.sin(5 * np.pi * x) ** 2 + 0.35 * x
    ht = ease(min(1, t / 0.6))
    n = max(2, int(len(x) * ht))
    inset.plot(x[:n], battery[:n], color=YELLOW, lw=2.5, label="Battery")
    if t > 0.25:
        n2 = max(2, int(len(x) * ease(min(1, (t - 0.25) / 0.35))))
        inset.plot(x[:n2], coin[:n2], color=BLUE, lw=2, label="Coin")
    if t > 0.4:
        n3 = max(2, int(len(x) * ease(min(1, (t - 0.4) / 0.35))))
        inset.plot(x[:n3], stacked[:n3], color=RED, lw=2, label="Stacked")
    inset.set_xlabel("Radius →", color=MUTED, fontsize=11)
    inset.set_ylabel("Intensity", color=MUTED, fontsize=11)
    inset.tick_params(colors=MUTED, labelsize=9)
    for spine in inset.spines.values():
        spine.set_color(GRID)
    inset.legend(facecolor="#161625", edgecolor=GRID, labelcolor=TEXT, fontsize=10, loc="upper left")
    if t > 0.55:
        caption(ax, "Batteries dip. Coins trend up. Stacked coins land in between.", y=0.75, size=16, color=MUTED, alpha=ease((t - 0.55) / 0.3))


def scene_results(ax, t: float):
    draw_grid(ax)
    caption(ax, "Benchmark · synthetic holdout", y=7.6, size=22, color=TEXT)
    labels = ["Battery\nsensitivity", "Emory 2020\nbaseline", "Stacked coin\ncatch"]
    vals = [100, 81, 65]
    colors = [YELLOW, MUTED, TEAL]
    ht = ease(min(1, t / 0.55))
    for i, (lab, val, col) in enumerate(zip(labels, vals, colors)):
        x = 3.2 + i * 3.5
        h = (val / 100) * 3.5 * ht
        bar = patches.FancyBboxPatch((x - 0.9, 1.5), 1.8, h, boxstyle="round,pad=0.02", fc=col, ec=WHITE, lw=0.8, alpha=0.9)
        ax.add_patch(bar)
        ax.text(x, 1.2, lab, ha="center", fontsize=12, color=MUTED)
        ax.text(x, 1.5 + h + 0.2, f"{val}%", ha="center", fontsize=18, color=col, fontweight="bold")
    if t > 0.45:
        caption(ax, "100% battery sensitivity · safety-first design", y=0.65, size=17, color=YELLOW, alpha=ease((t - 0.45) / 0.3))


def scene_close(ax, t: float):
    draw_grid(ax)
    op = ease(min(1, t / 0.35))
    caption(ax, "Haloscan", y=5.0, size=48, color=YELLOW, alpha=op)
    caption(ax, "Reese's Law fixed prevention.", y=3.7, size=22, color=TEXT, alpha=op)
    caption(ax, "This fixes diagnosis.", y=2.9, size=22, color=TEAL, alpha=op)
    if t > 0.3:
        caption(ax, "haloscan.ideatr.dev", y=1.5, size=26, color=BLUE, alpha=ease((t - 0.3) / 0.35))
        caption(ax, "Congressional App Challenge 2026", y=0.7, size=14, color=MUTED, alpha=ease((t - 0.4) / 0.35))


DRAWERS = {
    "title": scene_title,
    "problem": scene_problem,
    "xray_disc": scene_xray_disc,
    "double_halo": scene_double_halo,
    "stacked_trap": scene_stacked_trap,
    "reeses_law": scene_reeses_law,
    "gap": scene_gap,
    "architecture": scene_architecture,
    "radial": scene_radial,
    "results": scene_results,
    "close": scene_close,
}


def active_scene(time_s: float, scenes: list[Scene]) -> tuple[Scene, float]:
    for sc in scenes:
        if sc.start <= time_s < sc.end:
            return sc, (time_s - sc.start) / (sc.end - sc.start)
    return scenes[-1], 1.0


def render_frame(time_s: float, scenes: list[Scene]):
    sc, local_t = active_scene(time_s, scenes)
    fig, ax = setup_ax()
    DRAWERS[sc.draw](ax, local_t)
    return fig


def generate_narration(wav_path: Path) -> None:
    text = NARRATION.read_text().strip()
    # macOS say → wav (built-in, no API key)
    aiff = wav_path.with_suffix(".aiff")
    subprocess.run(["say", "-v", "Daniel", "-r", "168", "-o", str(aiff), text], check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(aiff), "-ac", "1", "-ar", "44100", str(wav_path)],
        check=True,
        capture_output=True,
    )
    aiff.unlink(missing_ok=True)


def mux(video: Path, audio: Path, out: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video),
            "-i",
            str(audio),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(out),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    silent_mp4 = OUT / "haloscan_explainer_silent.mp4"
    audio_wav = OUT / "haloscan_explainer_narration.wav"
    final_mp4 = OUT / "haloscan_explainer_3b1b.mp4"

    if not audio_wav.exists():
        print("→ Generating narration (macOS say)...")
        generate_narration(audio_wav)
    else:
        print("→ Using existing narration wav")

    duration = get_audio_duration(audio_wav)
    scenes = scaled_scenes(duration)
    total_frames = max(1, int(duration * FPS))
    print(f"→ Rendering {total_frames} frames @ {FPS}fps ({duration:.1f}s)...")

    writer = FFMpegWriter(fps=FPS, bitrate=2000, extra_args=["-pix_fmt", "yuv420p"])
    fig0 = render_frame(0, scenes)
    with writer.saving(fig0, str(silent_mp4), dpi=100):
        for i in range(total_frames):
            if i > 0:
                plt.close(fig0)
            t = i / FPS
            fig0 = render_frame(t, scenes)
            writer.grab_frame()
            if i % 75 == 0:
                print(f"  frame {i}/{total_frames} ({100 * i / total_frames:.0f}%)")
    plt.close(fig0)

    print("→ Muxing audio...")
    mux(silent_mp4, audio_wav, final_mp4)
    silent_mp4.unlink(missing_ok=True)

    size_mb = final_mp4.stat().st_size / (1024 * 1024)
    print(f"✓ {final_mp4} ({size_mb:.1f} MB)")
    print("  Upload to YouTube (public/unlisted) for CAC submission.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)

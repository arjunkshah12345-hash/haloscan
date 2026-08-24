#!/usr/bin/env python3
"""
Haloscan explainer — Manim (3Blue1Brown-style). SILENT — add your own voiceover.

Render:
  python3 -m manim -qm --format=mp4 scripts/manim_haloscan.py HaloscanExplainer
  python3 scripts/manim_haloscan.py --export

Optional auto-narration (not recommended if you're voicing):
  python3 scripts/manim_haloscan.py --mux
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from manim import *
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FIGURES = ROOT / "website" / "public" / "figures"
RENDERS = ROOT / "renders"
NARRATION = Path(__file__).with_name("explainer_narration.txt")

config.background_color = "#0f0e17"
config.frame_width = 16
config.frame_height = 9

YELLOW = "#FFE66D"
BLUE = "#4ECDC4"
SKY = "#58A6FF"
ROSE = "#FF6B6B"
MUTED = "#8888AA"
WHITE = "#E8E8F0"
GRID = "#1E1E32"
MATH_BG = "#161625"

# Pause between scenes — tune for your voiceover pacing
SCENE_PAD = 2.5

# Layout constants (16×9 frame) — prevents overlap
HEADER_Y = 3.55
CONTENT_CENTER = ORIGIN
SAFE_BOTTOM = -3.35


def serif(text: str, size: float = 32, color: str = WHITE, **kw) -> Text:
    return Text(text, font="Serif", font_size=size, color=color, **kw)


def header(text: str, color: str = WHITE, size: float = 34) -> Text:
    h = serif(text, size=size, color=color, weight=BOLD)
    h.to_edge(UP, buff=0.45)
    return h


def mono(text: str, size: float = 26, color: str = YELLOW) -> Text:
    return Text(text, font="Courier New", font_size=size, color=color)


class HaloscanExplainer(Scene):
    """Silent explainer — layout-safe, with NN diagram + math."""

    def construct(self) -> None:
        self.camera.background_color = "#0f0e17"
        self.grid = self._make_grid()
        self.add(self.grid)

        self._scene_title()
        self._scene_problem()
        self._scene_xray_compare()
        self._scene_double_halo()
        self._scene_stacked_trap()
        self._scene_reeses_law()
        self._scene_gap()
        self._scene_dualview_net()
        self._scene_fusion_math()
        self._scene_architecture()
        self._scene_radial_graph()
        self._scene_benchmark()
        self._scene_close()

    def _make_grid(self) -> VGroup:
        lines = VGroup()
        for x in np.arange(-8, 8.1, 0.8):
            lines.add(Line([x, -4.5, 0], [x, 4.5, 0], stroke_width=0.35, color=GRID, stroke_opacity=0.4))
        for y in np.arange(-4.5, 4.5, 0.8):
            lines.add(Line([-8, y, 0], [8, y, 0], stroke_width=0.35, color=GRID, stroke_opacity=0.4))
        return lines

    def _fade_all(self, *mobs, run_time: float = 0.7) -> None:
        self.wait(SCENE_PAD)
        if mobs:
            self.play(*[FadeOut(m) for m in mobs], run_time=run_time)

    # ── 1. Title ─────────────────────────────────────────────────────────────
    def _scene_title(self) -> None:
        t1 = Text("Haloscan", font="Serif", font_size=68, color=YELLOW, weight=BOLD)
        t2 = serif("The diagnosis Congress didn't solve", size=28)
        t3 = serif("Pediatric chest X-ray  ·  battery vs coin", size=20, color=MUTED)
        grp = VGroup(t1, t2, t3).arrange(DOWN, buff=0.38).move_to(CONTENT_CENTER)
        self.play(Write(t1, run_time=1.2))
        self.play(FadeIn(t2, shift=UP * 0.15), FadeIn(t3, shift=UP * 0.1), run_time=0.8)
        self._fade_all(t1, t2, t3)

    # ── 2. Problem ───────────────────────────────────────────────────────────
    def _scene_problem(self) -> None:
        cap = header("A disc-shaped foreign body on X-ray")

        head = Circle(radius=0.4, color=WHITE, stroke_width=2).shift(LEFT * 4 + UP * 0.5)
        body = RoundedRectangle(width=1.0, height=1.4, corner_radius=0.12, color=WHITE, stroke_width=2)
        body.next_to(head, DOWN, buff=0.04)
        stick = VGroup(head, body).shift(DOWN * 0.2)

        disc = Circle(radius=0.14, fill_color=YELLOW, fill_opacity=1, stroke_color=WHITE, stroke_width=1.5)
        disc.move_to(body.get_center() + DOWN * 0.12)

        q = serif("Battery or coin?", size=38, color=YELLOW).shift(RIGHT * 3.2)
        clock = serif("~2 hour window if esophageal", size=22, color=ROSE).next_to(q, DOWN, buff=0.35)

        self.play(Write(cap, run_time=0.7))
        self.play(DrawBorderThenFill(stick), GrowFromCenter(disc), run_time=1.0)
        self.play(Write(q, run_time=0.9))
        self.play(FadeIn(clock, shift=UP * 0.1), run_time=0.5)
        self._fade_all(cap, stick, disc, q, clock)

    # ── 3. X-ray compare ─────────────────────────────────────────────────────
    def _scene_xray_compare(self) -> None:
        cap = header("Both appear as radiopaque discs")

        bat_path = FIGURES / "battery" / "ap.png"
        coin_path = FIGURES / "coin" / "ap.png"
        imgs: list = []
        if bat_path.exists() and coin_path.exists():
            bat = ImageMobject(str(bat_path)).set(height=2.8).shift(LEFT * 3.5 + DOWN * 0.15)
            coin = ImageMobject(str(coin_path)).set(height=2.8).shift(RIGHT * 3.5 + DOWN * 0.15)
            lb = serif("Battery", size=22, color=YELLOW).next_to(bat, DOWN, buff=0.2)
            lc = serif("Coin", size=22, color=SKY).next_to(coin, DOWN, buff=0.2)
            imgs = [bat, coin, lb, lc]
            self.play(Write(cap, run_time=0.6))
            self.play(FadeIn(bat, shift=RIGHT * 0.2), FadeIn(coin, shift=LEFT * 0.2), run_time=1.0)
            self.play(FadeIn(lb), FadeIn(lc), run_time=0.4)
        else:
            self.play(Write(cap, run_time=0.6))
        self._fade_all(cap, *imgs)

    # ── 4. Double halo ───────────────────────────────────────────────────────
    def _scene_double_halo(self) -> None:
        cap = header('The "double halo sign"', color=YELLOW)

        disc = Circle(radius=1.35, fill_color="#DFE6F0", fill_opacity=0.95, stroke_color=WHITE, stroke_width=2)
        disc.shift(DOWN * 0.1)
        ring_outer = Annulus(inner_radius=0.95, outer_radius=1.15, fill_color=YELLOW, fill_opacity=0.5, stroke_width=0)
        ring_inner = Annulus(inner_radius=0.5, outer_radius=0.68, fill_color=BLUE, fill_opacity=0.4, stroke_width=0)
        rings = VGroup(disc, ring_outer, ring_inner).move_to(CONTENT_CENTER + DOWN * 0.1)

        lbl_o = serif("outer rim", size=18, color=YELLOW).shift(LEFT * 3.2 + UP * 1.6)
        lbl_i = serif("inner ring", size=18, color=BLUE).shift(RIGHT * 3.0 + DOWN * 1.8)
        arr_o = Arrow(lbl_o.get_right(), rings.get_center() + UL * 0.9, buff=0.06, color=YELLOW, stroke_width=2)
        arr_i = Arrow(lbl_i.get_left(), rings.get_center() + DR * 0.55, buff=0.06, color=BLUE, stroke_width=2)

        self.play(Write(cap, run_time=0.7))
        self.play(GrowFromCenter(disc), run_time=0.7)
        self.play(LaggedStart(GrowFromCenter(ring_outer), GrowFromCenter(ring_inner), lag_ratio=0.35, run_time=1.0))
        self.play(FadeIn(lbl_o), FadeIn(lbl_i), GrowArrow(arr_o), GrowArrow(arr_i), run_time=0.8)
        self._fade_all(cap, rings, lbl_o, lbl_i, arr_o, arr_i)

    # ── 5. Stacked trap ──────────────────────────────────────────────────────
    def _scene_stacked_trap(self) -> None:
        cap = header("Stacked coins mimic the halo", color=ROSE)

        disc = Circle(radius=1.25, fill_color="#DFE6F0", fill_opacity=0.95, stroke_color=WHITE, stroke_width=2)
        ghost = Circle(radius=1.1, color=MUTED, stroke_width=2, stroke_opacity=0.65).shift(RIGHT * 0.1 + UP * 0.08)
        false_ring = Annulus(inner_radius=0.58, outer_radius=0.78, fill_color=YELLOW, fill_opacity=0.32, stroke_width=0)
        vis = VGroup(disc, ghost, false_ring).move_to(CONTENT_CENTER)

        note = serif("False halo  →  dangerous reassurance", size=24, color=ROSE).to_edge(DOWN, buff=0.55)

        self.play(Write(cap, run_time=0.7))
        self.play(GrowFromCenter(disc), Create(ghost), run_time=0.8)
        self.play(GrowFromCenter(false_ring), run_time=0.7)
        self.play(Indicate(false_ring, color=ROSE, scale_factor=1.06), run_time=0.8)
        self.play(FadeIn(note, shift=UP * 0.1), run_time=0.5)
        self._fade_all(cap, vis, note)

    # ── 6. Reese's Law ───────────────────────────────────────────────────────
    def _scene_reeses_law(self) -> None:
        cap = header("Reese's Law (2022)", color=YELLOW)

        vote = Text("409 – 2", font="Serif", font_size=88, color=BLUE, weight=BOLD)
        vote.move_to(CONTENT_CENTER + UP * 0.3)

        prev = serif("Child-proof packaging", size=26).next_to(vote, DOWN, buff=0.55)
        gap = serif("Prevention fixed  ·  Diagnosis did not", size=24, color=ROSE).next_to(prev, DOWN, buff=0.35)

        self.play(Write(cap, run_time=0.6))
        self.play(FadeIn(vote, scale=0.6), run_time=0.9, rate_func=rate_functions.ease_out_back)
        self.play(FadeIn(prev, shift=UP * 0.1), run_time=0.5)
        self.play(FadeIn(gap, shift=UP * 0.1), run_time=0.5)
        self._fade_all(cap, vote, prev, gap)

    # ── 7. Gap ───────────────────────────────────────────────────────────────
    def _scene_gap(self) -> None:
        cap = header("Haloscan closes the gap", color=YELLOW)

        def box(title: str, lines: str, col: str) -> VGroup:
            r = RoundedRectangle(width=3.2, height=2.0, corner_radius=0.1, color=col, stroke_width=2)
            t = serif(title, size=19, color=col, weight=BOLD).move_to(r.get_top() + DOWN * 0.38)
            b = serif(lines, size=15, color=MUTED).move_to(r.get_center() + DOWN * 0.1)
            return VGroup(r, t, b)

        boxes = VGroup(
            box("ER physician", "Battery or coin?\nNo overnight\nradiologist", MUTED),
            box("Haloscan", "CV + neural net\nExplainable\nSafety-first", YELLOW),
            box("Protocol", "CRITICAL\nURGENT\nROUTINE", SKY),
        ).arrange(RIGHT, buff=0.45).shift(DOWN * 0.15)

        arrows = VGroup(
            Arrow(boxes[0].get_right(), boxes[1].get_left(), buff=0.1, color=BLUE, stroke_width=2.5),
            Arrow(boxes[1].get_right(), boxes[2].get_left(), buff=0.1, color=BLUE, stroke_width=2.5),
        )

        self.play(Write(cap, run_time=0.7))
        self.play(LaggedStart(*[FadeIn(b, shift=UP * 0.2) for b in boxes], lag_ratio=0.25, run_time=1.2))
        self.play(LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.3, run_time=0.7))
        self._fade_all(cap, boxes, arrows)

    # ── 8. DualViewNet diagram ───────────────────────────────────────────────
    def _scene_dualview_net(self) -> None:
        cap = header("DualViewNet architecture", color=SKY)

        def conv_stack(label: str, x: float, y: float, color: str) -> VGroup:
            layers = VGroup()
            specs = [("Conv 3×3", 32), ("Conv 3×3", 64), ("Conv 3×3", 128)]
            for i, (nm, ch) in enumerate(specs):
                r = RoundedRectangle(width=2.0, height=0.55, corner_radius=0.06, color=color, stroke_width=1.8, fill_color=MATH_BG, fill_opacity=0.9)
                r.shift(UP * (1.0 - i * 0.65))
                txt = mono(f"{nm} → {ch}", size=16, color=color).move_to(r.get_center())
                layers.add(VGroup(r, txt))
            layers.move_to([x, y, 0])
            lbl = serif(label, size=18, color=color, weight=BOLD).next_to(layers, UP, buff=0.2)
            return VGroup(lbl, layers)

        ap_enc = conv_stack("AP encoder", -4.5, 0.0, SKY)
        lat_enc = conv_stack("Lateral encoder", -4.5, -2.6, BLUE)

        concat = RoundedRectangle(width=1.6, height=0.7, corner_radius=0.08, color=YELLOW, stroke_width=2)
        concat.move_to(RIGHT * 0.2)
        concat_lbl = mono("concat", size=18, color=YELLOW).move_to(concat.get_center())

        mlp = VGroup()
        for i, (nm, dim) in enumerate([("Linear", 128), ("ReLU", ""), ("Linear", "3 classes")]):
            r = RoundedRectangle(width=2.4, height=0.55, corner_radius=0.06, color=YELLOW, stroke_width=1.8, fill_color=MATH_BG, fill_opacity=0.9)
            r.shift(RIGHT * 3.2 + DOWN * i * 0.65)
            t = mono(f"{nm} {dim}".strip(), size=16, color=YELLOW).move_to(r.get_center())
            mlp.add(VGroup(r, t))
        mlp_lbl = serif("Fusion MLP", size=18, color=YELLOW, weight=BOLD).next_to(mlp, UP, buff=0.2)

        softmax = serif("softmax → P(battery, coin, normal)", size=18, color=WHITE).next_to(mlp, DOWN, buff=0.35)

        ap_img = RoundedRectangle(width=1.4, height=1.0, color=MUTED, stroke_width=1.5).shift(LEFT * 6.8 + UP * 0.2)
        ap_txt = serif("AP", size=16).move_to(ap_img.get_center())
        lat_img = RoundedRectangle(width=1.4, height=1.0, color=MUTED, stroke_width=1.5).shift(LEFT * 6.8 + DOWN * 2.8)
        lat_txt = serif("LAT", size=16).move_to(lat_img.get_center())

        arr_ap = Arrow(ap_img.get_right(), ap_enc.get_left(), buff=0.08, color=MUTED, stroke_width=2)
        arr_lat = Arrow(lat_img.get_right(), lat_enc.get_left(), buff=0.08, color=MUTED, stroke_width=2)
        arr_c1 = Arrow(ap_enc.get_right(), concat.get_left() + UP * 0.15, buff=0.08, color=SKY, stroke_width=2)
        arr_c2 = Arrow(lat_enc.get_right(), concat.get_left() + DOWN * 0.15, buff=0.08, color=BLUE, stroke_width=2)
        arr_m = Arrow(concat.get_right(), mlp[0].get_left(), buff=0.08, color=YELLOW, stroke_width=2.5)

        self.play(Write(cap, run_time=0.6))
        self.play(FadeIn(ap_img), FadeIn(ap_txt), FadeIn(lat_img), FadeIn(lat_txt), run_time=0.5)
        self.play(LaggedStart(FadeIn(ap_enc), FadeIn(lat_enc), lag_ratio=0.35, run_time=1.0))
        self.play(GrowArrow(arr_ap), GrowArrow(arr_lat), run_time=0.5)
        self.play(FadeIn(concat), FadeIn(concat_lbl), GrowArrow(arr_c1), GrowArrow(arr_c2), run_time=0.7)
        self.play(FadeIn(mlp_lbl), FadeIn(mlp), GrowArrow(arr_m), run_time=0.8)
        self.play(FadeIn(softmax, shift=UP * 0.1), run_time=0.5)

        all_m = VGroup(cap, ap_enc, lat_enc, concat, concat_lbl, mlp, mlp_lbl, softmax, ap_img, ap_txt, lat_img, lat_txt, arr_ap, arr_lat, arr_c1, arr_c2, arr_m)
        self._fade_all(*all_m)

    # ── 9. Fusion math ───────────────────────────────────────────────────────
    def _scene_fusion_math(self) -> None:
        cap = header("Ensemble fusion + training objective", color=YELLOW)

        eq1 = mono("P(bat) = 0.55·P_cv + 0.40·P_cnn + bonus", size=24, color=YELLOW)
        eq2 = mono("if halo > 0.40  AND  stepoff < 0.38  →  CRITICAL", size=20, color=ROSE)
        eq3 = mono("L = CrossEntropy( y , ŷ ;  w = [3.0, 1.0, 0.5] )", size=22, color=SKY)
        eq4 = serif("Missing a battery costs 3× more than missing a coin", size=20, color=MUTED)

        panel = RoundedRectangle(width=12.5, height=3.8, corner_radius=0.12, color=MUTED, stroke_width=1.5, fill_color=MATH_BG, fill_opacity=0.95)
        panel.move_to(CONTENT_CENTER)

        eqs = VGroup(eq1, eq2, eq3, eq4).arrange(DOWN, buff=0.42, aligned_edge=LEFT)
        eqs.move_to(panel.get_center())

        w_cv = serif("CV branch", size=18, color=BLUE).shift(LEFT * 5.5 + UP * 2.0)
        w_nn = serif("CNN branch", size=18, color=SKY).shift(RIGHT * 0.5 + UP * 2.0)
        w_out = serif("Emergency override", size=18, color=ROSE).shift(RIGHT * 5.0 + UP * 2.0)

        self.play(Write(cap, run_time=0.6))
        self.play(FadeIn(panel, scale=0.95), run_time=0.5)
        self.play(LaggedStart(*[Write(e) for e in eqs], lag_ratio=0.35, run_time=2.0))
        self.play(FadeIn(w_cv), FadeIn(w_nn), FadeIn(w_out), run_time=0.5)
        self._fade_all(cap, panel, eqs, w_cv, w_nn, w_out)

    # ── 10. Architecture pipeline ────────────────────────────────────────────
    def _scene_architecture(self) -> None:
        cap = header("Full inference pipeline")

        def pill(label: str, sub: str, color: str) -> VGroup:
            r = RoundedRectangle(width=2.5, height=1.05, corner_radius=0.1, color=color, stroke_width=2, fill_color=MATH_BG, fill_opacity=0.85)
            t = serif(label, size=16, color=color, weight=BOLD).move_to(r.get_top() + DOWN * 0.32)
            s = serif(sub, size=13, color=MUTED).move_to(r.get_center() + DOWN * 0.12)
            return VGroup(r, t, s)

        row1 = VGroup(
            pill("CLAHE", "contrast", MUTED),
            pill("Halo CV", "radial profile", BLUE),
            pill("DualViewNet", "PyTorch", SKY),
            pill("Ensemble", "fusion", YELLOW),
            pill("Protocol", "CRITICAL…", ROSE),
        ).arrange(RIGHT, buff=0.28).shift(UP * 0.5)

        arrows = VGroup(*[
            Arrow(row1[i].get_right(), row1[i + 1].get_left(), buff=0.06, color=MUTED, stroke_width=2)
            for i in range(4)
        ])

        grad_path = FIGURES / "battery" / "gradcam.png"
        grad_mobs: list = []
        if grad_path.exists():
            grad = ImageMobject(str(grad_path)).set(height=2.2).shift(DOWN * 1.85)
            gl = serif("Grad-CAM explainability", size=17, color=MUTED).next_to(grad, DOWN, buff=0.12)
            grad_mobs = [grad, gl]

        self.play(Write(cap, run_time=0.6))
        self.play(LaggedStart(*[FadeIn(p, shift=UP * 0.15) for p in row1], lag_ratio=0.15, run_time=1.2))
        self.play(LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.12, run_time=0.8))
        if grad_mobs:
            self.play(FadeIn(grad_mobs[0], shift=UP * 0.15), FadeIn(grad_mobs[1], shift=UP * 0.15), run_time=0.7)
        self._fade_all(cap, row1, arrows, *grad_mobs)

    # ── 11. Radial graph ─────────────────────────────────────────────────────
    def _scene_radial_graph(self) -> None:
        cap = header("Radial intensity profile (CV branch)", color=BLUE)

        axes = Axes(
            x_range=[0, 1, 0.25],
            y_range=[0, 1.15, 0.25],
            x_length=9,
            y_length=3.8,
            axis_config={"color": MUTED, "stroke_width": 1.8, "font_size": 18},
            tips=False,
        ).shift(DOWN * 0.55)

        def battery_fn(x):
            return 0.3 + 0.45 * np.sin(6 * np.pi * x) ** 2 + 0.22 * x

        def coin_fn(x):
            return 0.25 + 0.65 * x

        def stacked_fn(x):
            return 0.28 + 0.32 * np.sin(5 * np.pi * x) ** 2 + 0.32 * x

        g_bat = axes.plot(battery_fn, x_range=[0, 1], color=YELLOW, stroke_width=3.5)
        g_coin = axes.plot(coin_fn, x_range=[0, 1], color=SKY, stroke_width=2.5)
        g_stk = axes.plot(stacked_fn, x_range=[0, 1], color=ROSE, stroke_width=2.5)

        x_lbl = serif("radius", size=16, color=MUTED).next_to(axes.x_axis, DOWN, buff=0.15)
        y_lbl = serif("I(r)", size=16, color=MUTED).next_to(axes.y_axis, LEFT, buff=0.15).rotate(90 * DEGREES)

        leg = VGroup(
            Dot(color=YELLOW, radius=0.06),
            serif("Battery", size=16, color=YELLOW),
            Dot(color=SKY, radius=0.06),
            serif("Coin", size=16, color=SKY),
            Dot(color=ROSE, radius=0.06),
            serif("Stacked", size=16, color=ROSE),
        ).arrange(RIGHT, buff=0.18).to_edge(RIGHT, buff=0.55).shift(UP * 2.85)

        self.play(Write(cap, run_time=0.6))
        self.play(Create(axes), FadeIn(x_lbl), FadeIn(y_lbl), run_time=0.8)
        self.play(Create(g_bat), run_time=1.2, rate_func=linear)
        dot = Dot(color=YELLOW, radius=0.07).move_to(g_bat.point_from_proportion(0))
        self.add(dot)
        self.play(MoveAlongPath(dot, g_bat), run_time=1.0, rate_func=linear)
        self.play(Create(g_coin), Create(g_stk), run_time=0.9, rate_func=linear)
        self.play(FadeIn(leg), run_time=0.4)
        self._fade_all(cap, axes, x_lbl, y_lbl, g_bat, g_coin, g_stk, dot, leg)

    # ── 12. Benchmark ────────────────────────────────────────────────────────
    def _scene_benchmark(self) -> None:
        cap = header("Synthetic holdout benchmark")

        data = [("Battery sens.", 100, YELLOW), ("Emory 2020", 81, MUTED), ("Stacked catch", 65, BLUE)]
        bars = VGroup()
        for i, (label, val, col) in enumerate(data):
            h = val / 100 * 2.8
            rect = RoundedRectangle(width=1.6, height=max(h, 0.05), corner_radius=0.06, fill_color=col, fill_opacity=0.88, stroke_width=0)
            rect.move_to(LEFT * 3.2 + RIGHT * i * 3.2 + DOWN * (1.2 - h / 2))
            pct = serif(f"{val}%", size=26, color=col, weight=BOLD).next_to(rect, UP, buff=0.12)
            lbl = serif(label, size=16, color=MUTED).next_to(rect, DOWN, buff=0.18)
            bars.add(VGroup(rect, pct, lbl))

        self.play(Write(cap, run_time=0.6))
        self.play(LaggedStart(*[GrowFromEdge(b[0], DOWN) for b in bars], lag_ratio=0.25, run_time=1.2))
        self.play(LaggedStart(*[FadeIn(b[1]) for b in bars], *[FadeIn(b[2]) for b in bars], lag_ratio=0.12, run_time=0.6))
        self._fade_all(cap, bars)

    # ── 13. Close ────────────────────────────────────────────────────────────
    def _scene_close(self) -> None:
        t1 = Text("Haloscan", font="Serif", font_size=58, color=YELLOW, weight=BOLD)
        t2 = serif("Reese's Law fixed prevention.", size=26)
        t3 = serif("This fixes diagnosis.", size=26, color=BLUE)
        url = serif("haloscan.ideatr.dev", size=32, color=SKY)
        grp = VGroup(t1, t2, t3, url).arrange(DOWN, buff=0.38).move_to(CONTENT_CENTER)

        self.play(Write(t1, run_time=1.0))
        self.play(LaggedStart(FadeIn(t2), FadeIn(t3), lag_ratio=0.4, run_time=0.9))
        self.play(FadeIn(url, scale=0.92), run_time=0.6)
        self.wait(3.0)


def find_latest_render() -> Path | None:
    for sub in ("720p30", "480p15", "1080p60"):
        media = ROOT / "media" / "videos" / "manim_haloscan" / sub
        if media.exists():
            files = sorted(media.glob("HaloscanExplainer*.mp4"), key=lambda p: p.stat().st_mtime)
            if files:
                return files[-1]
    return None


def export_silent() -> None:
    RENDERS.mkdir(exist_ok=True)
    src = find_latest_render()
    if not src:
        print("No render found. Run manim first.")
        sys.exit(1)
    out = RENDERS / "haloscan_explainer_silent.mp4"
    shutil.copy2(src, out)
    dur = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(out)],
        text=True,
    )
    print(f"✓ Silent export: {out} ({float(dur.strip()):.1f}s)")
    print("  Add voiceover in iMovie / DaVinci / Premiere")


def generate_narration(wav: Path) -> None:
    text = NARRATION.read_text().strip()
    aiff = wav.with_suffix(".aiff")
    subprocess.run(["say", "-v", "Daniel", "-r", 165, "-o", str(aiff), text], check=True)
    subprocess.run(["ffmpeg", "-y", "-i", str(aiff), "-ac", "1", "-ar", "44100", str(wav)], check=True, capture_output=True)
    aiff.unlink(missing_ok=True)


def mux(video: Path, audio: Path, out: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(video), "-i", str(audio), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)],
        check=True,
        capture_output=True,
    )


def main_mux() -> None:
    RENDERS.mkdir(exist_ok=True)
    wav = RENDERS / "haloscan_explainer_narration.wav"
    if not wav.exists():
        generate_narration(wav)
    src = find_latest_render()
    if not src:
        sys.exit(1)
    out = RENDERS / "haloscan_explainer_3b1b.mp4"
    mux(src, wav, out)
    print(f"✓ {out}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--export":
        export_silent()
    elif len(sys.argv) > 1 and sys.argv[1] == "--mux":
        main_mux()

# Haloscan — Video Guide

## Manim explainer (3Blue1Brown-style) — SILENT for your voiceover

```bash
python3 -m manim -qm --format=mp4 scripts/manim_haloscan.py HaloscanExplainer
python3 scripts/manim_haloscan.py --export
# → renders/haloscan_explainer_silent.mp4
```

**Add voiceover:** import silent MP4 into iMovie / DaVinci / Premiere, record on top.

**Tune pacing:** edit `SCENE_PAD` in `scripts/manim_haloscan.py` (seconds between scenes).

**What's in the video:**
- Title, problem, real X-ray PNGs, double halo annulus animation
- Stacked-coin trap, Reese's Law 409–2
- **DualViewNet diagram** (twin encoders, concat, fusion MLP, softmax)
- **Math panel:** fusion equation, ambiguity rule, weighted cross-entropy loss
- Pipeline pills + Grad-CAM, radial profile graph with tracing dot, benchmark bars

**Quality:** `-ql` preview · `-qm` 720p submit · `-qh` 1080p60

Optional auto-narration (skip if you're voicing): `python3 scripts/manim_haloscan.py --mux`

---

## Live screen recording (backup)

Record **https://haloscan.ideatr.dev/scan** — keys **1** and **3**.

---

## CAC checklist

- [ ] 1–3 min with your voiceover
- [ ] Name(s), app name **Haloscan**, purpose, audience, tools
- [ ] YouTube/Vimeo link in submission form


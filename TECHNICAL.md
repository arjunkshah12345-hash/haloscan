# Haloscan — Technical Documentation

For Congressional App Challenge judges evaluating coding depth.

HaloScan is an **experimental research prototype**. Numbers below are from a procedural synthetic generator unless a section says otherwise. They are not clinical sensitivity and are not a comparison with Emory 2020.

## Problem statement

[Reese's Law](https://www.congress.gov/bill/117th-congress/house-bill/5313) (Public Law 117-171, August 16, 2022) requires safer packaging, labels, and battery compartments. It is a prevention statute, not a diagnostic product.

On pediatric chest radiographs, button batteries and coins can both look like radiopaque discs. Radiologists may look for a "double halo" on an AP film. Stacked coins can mimic that pattern. Suspected button-battery ingestion needs emergency care regardless of any app score.

A 2020 Emory SPR abstract (Rostad et al.) reported a YOLOv2 model on 228 radiographs. HaloScan's synthetic metrics are not a head-to-head with that study.

## Architecture

```
┌─────────────┐     ┌──────────────────┐
│  AP image   │────►│ CLAHE + invert   │────► Radial halo profiler
└─────────────┘     └──────────────────┘              │
                                                        ├──► Ensemble ──► Research label
┌─────────────┐     ┌──────────────────┐              │         │
│  Lateral    │────►│ Step-off analyzer│──────────────┘         ├──► Grad-CAM
└─────────────┘     └──────────────────┘                        │
                                                        DualViewNet ──► Uncertainty
```

### 1. Computer vision layer (`halo_analyzer.py`)

- **Disc localization:** Otsu thresholding → contour circularity scoring → Hough circle fallback → adaptive threshold fallback
- **Radial profile:** Sample intensity at increasing radii from disc center; normalize to [0,1]
- **Halo score:** Detect dip between inner peaks (lucent ring of a battery rim on the drawing)
- **Multi-peak detector:** Counts radial intensity peaks — stacked coins often show extra rings on AP (`stacked_mimic_score`)
- **Step-off score:** Vertical mass asymmetry on a lateral view

### 2. Neural network layer (`models.py`)

- **ViewEncoder:** 3-block CNN (32→64→128 channels) with adaptive pool to a 128-d vector
- **DualViewNet:** Twin encoders + input concat to 256 → MLP 256→128→3. A missing lateral is a zero vector
- Training uses battery-weighted cross-entropy. Stacked coins are labeled as the battery class in the current generator pipeline

### 3. Ensemble fusion (`inference.py`)

Approximate fusion (see source for exact constants):

```
battery_score ≈ w_cv·CV + w_cnn·CNN + dual_bonus + ambiguity heuristics
```

Ambiguity / stacked-mimic rules can raise a **research flag**. That flag is not a treatment order and must not be read as a clinical disposition.

### 4. Explainability (`gradcam.py`)

Gradient-weighted Class Activation Mapping on the final conv block, typically targeting the battery class. Overlaid for inspection of what the network attended to on a synthetic image.

### 5. Research readout (`clinical.py`)

Maps scores and ambiguity into a research label (`BATTERY-LIKE PATTERN`, `COIN-LIKE PATTERN`, `AMBIGUOUS PATTERN`, `NO DISC PATTERN`) plus uncertainty notes and hotline contacts. It does **not** emit CRITICAL / URGENT / ROUTINE care pathways, discharge language, or endoscopy orders.

## Training data

Synthetic generator (`synthetic.py`) — no PHI. Disc drawings on a stick-figure background. AP and lateral pairs are independent draws, not two projections of one physical object. That pairing artifact is a known limitation: on the 2026-10-11 holdout, attaching a separate synthetic lateral made the dual-view CNN call every coin battery-like.

## Evaluation

Prefer `python3 -m haloscan.eval_suite --n 40` and the artifact in `docs/eval/eval_report.json`.

That suite reports:

- Holdout and distribution-shifted synthetic sets
- Ablations (CNN-only, CV-only, ensemble, AP-only, AP+lateral, ensemble without ambiguity rules)
- Confusion-style counts, precision / recall / specificity / F1 for the research flag
- Wilson intervals, threshold curves, CPU latency
- Weights SHA-256 and git commit

Do not treat point estimates on 40 drawn images per class as clinical accuracy.

## API surface

| Route | Purpose |
|-------|---------|
| `POST /api/analyze` | Full inference pipeline |
| `POST /api/report` | Downloadable HTML research report |
| `GET /api/demo/{case}` | Synthetic demo cases |
| `GET /api/metrics` | Evaluation artifact or legacy point estimates |
| `GET /api/health` | Process and model load status |

Public site: https://haloscan-cac.vercel.app · API: https://haloscan.onrender.com

<p align="center">
  <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" stroke="#ef4444" stroke-width="1.2" opacity="0.45"/>
    <circle cx="16" cy="16" r="9" stroke="#ef4444" stroke-width="1.4" opacity="0.75"/>
    <circle cx="16" cy="16" r="4" fill="#ef4444"/>
  </svg>
</p>

<h1 align="center">haloscan</h1>
<p align="center"><em>the double halo, decoded.</em></p>

<p align="center">
  <a href="https://haloscan-cac.vercel.app/scan">Live Scanner</a> ·
  <a href="https://haloscan-cac.vercel.app/scan?judge=1">Judge Demo</a> ·
  <a href="https://haloscan-cac.vercel.app/judges">Judge Guide</a> ·
  <a href="https://www.kaggle.com/code/aks1321/coincell-train-cpu">Training</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/CAC-2026-red?style=flat-square" alt="Congressional App Challenge" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT" />
  <img src="https://img.shields.io/badge/python-3.10+-green?style=flat-square" alt="Python" />
  <img src="https://img.shields.io/badge/status-experimental_prototype-lightgrey?style=flat-square" alt="Experimental research prototype" />
  <img src="https://img.shields.io/badge/Reese's_Law-P.L._117--171-lightgrey?style=flat-square" alt="Reese's Law" />
</p>

---

**HaloScan** is an experimental research prototype that studies button-battery-like and coin-like patterns on synthetic X-ray images. It is not a medical device and it does not diagnose.

[Reese's Law](https://www.congress.gov/bill/117th-congress/house-bill/5313) (Public Law 117-171, August 16, 2022) requires safer packaging, labels, and battery compartments. It is a prevention statute. The House passed the bill under suspension of the rules and the Senate passed it by unanimous consent. Suspected button-battery ingestion needs emergency care regardless of this app. National Battery Ingestion Hotline: **1-800-498-8666**. A 2020 Emory abstract reported a YOLOv2 model on 228 radiographs. HaloScan's numbers are synthetic and are not a comparison with that study.

<p align="center">
  <a href="https://haloscan-cac.vercel.app/scan"><strong>→ Try the live demo</strong></a>
</p>

---

## Why "Haloscan"

Radiologists look for a **double halo** on AP films — bright outer rim, darker center, inner ring — when a button battery is suspected. HaloScan measures a radial profile, fuses it with a dual-view network, and shows an uncertainty readout. It does not output a treatment plan.

---

## Measurements

Synthetic only. See `docs/eval/eval_report.json` after `python3 -m haloscan.eval_suite --n 40`, and the [evaluation page](https://haloscan-cac.vercel.app/validation). Do not read a point estimate on 40 drawn images as clinical sensitivity, and do not compare it with the Emory 2020 radiograph study.

**Dual-view finding (documented, not hidden):** DualViewNet alone still calls every synthetic coin battery-like when an independently drawn lateral is attached (`cnn_only` coin-pattern rate **0/40**). Classical AP profiling and AP-only CNN separate coins. The default **ensemble** applies a dual-view collapse guard so fusion does not follow DualViewNet when AP-only CNN and classical agree on coin (ensemble coin-pattern rate **40/40** on the 2026-10-12 holdout). Stacked-coin research flags remain **35/40**.

---

## Quick start

```bash
git clone https://github.com/arjunkshah12345-hash/haloscan.git
cd haloscan
pip install -r requirements.txt
./scripts/run.sh
```

Open **http://localhost:7860** — upload AP + optional lateral images, get a research readout, Grad-CAM, and a printable report. Scores are uncalibrated and not a diagnosis.

Weights ship in `weights/haloscan.pt`. No API keys. Runs **offline**.

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AP image   │────▶│  Halo analyzer   │────▶│                 │
│  (CLAHE)    │     │  radial profile  │     │   Ensemble      │
└─────────────┘     └──────────────────┘     │   CV + CNN      │
┌─────────────┐     ┌──────────────────┐     │   dual bonus    │──▶ Research label
│  Lateral    │────▶│  Step-off detect │────▶│   ambiguity     │    Grad-CAM
└─────────────┘     └──────────────────┘     │                 │    Uncertainty
                              │               └────────▲────────┘
                              └──── DualViewNet ───────┘
```

<details>
<summary><strong>Key modules</strong></summary>

| File | Role |
|------|------|
| `haloscan/halo_analyzer.py` | Radial halo profiling, Hough fallback |
| `haloscan/models.py` | DualViewNet — AP + lateral fusion |
| `haloscan/inference.py` | Ensemble, Grad-CAM, stacked-coin heuristics |
| `haloscan/clinical.py` | Research readout and uncertainty (no care orders) |
| `haloscan/report.py` | Printable HTML research report |
| `haloscan/eval_suite.py` | Holdout, shifted set, ablations, Wilson intervals |

</details>

---

## Project layout

```
haloscan/          # Python ML + research readout
api/               # FastAPI backend
static/            # Local web UI (upload + inference)
website/           # Public site → Vercel
weights/           # Bundled model weights (~3.5 MB)
docs/              # Audit, evaluation artifact, verification
kaggle/            # CPU training notebook
tests/             # Smoke + release tests
```
---

## Training

**Kaggle CPU:** [coincell-train-cpu](https://www.kaggle.com/code/aks1321/coincell-train-cpu) *(legacy kernel name)*

```bash
kaggle kernels push -p kaggle
# Download haloscan.pt → weights/haloscan.pt
python3 scripts/export_demo_assets.py   # refresh Vercel demo
```

**Local:**

```bash
HALOSCAN_N_PER_CLASS=100 HALOSCAN_EPOCHS=6 python3 scripts/train_cpu.py
```

---

## Development

```bash
python3 tests/smoke_test.py              # must pass
python3 -m haloscan.evaluate --n 40     # benchmark
python3 scripts/export_figures.py       # regenerate site figures (X-ray, Grad-CAM, etc.)
cd website && npm run dev                # marketing site
```

---

## Congressional App Challenge 2026

A student research prototype about measuring battery-like and coin-like patterns on synthetic images, with honest synthetic limits and no clinical claims.

| Resource | Link |
|----------|------|
| Live demo | https://haloscan-cac.vercel.app/scan |
| Judge guide | https://haloscan-cac.vercel.app/judges · [`JUDGE_GUIDE.md`](JUDGE_GUIDE.md) |
| API (Render) | https://haloscan.onrender.com |
| Submission copy | [`SUBMISSION_FINAL.md`](SUBMISSION_FINAL.md) |
| Video script | [`VIDEO_FINAL.md`](VIDEO_FINAL.md) |
| Release checklist | [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) |

Older drafts (`SUBMISSION_FORM.md`, `VIDEO.md`, `WIN.md`) are superseded. Do not paste them into the entry form.

---

## Disclaimer

**Experimental research prototype only.** Not a medical device. Not FDA cleared. Not clinically validated.

Suspected button battery ingestion → emergency services · Poison Help **1-800-222-1222** · National Battery Ingestion Hotline **1-800-498-8666**

---

## License

[MIT](LICENSE) — use it, learn from it, fork it.

<p align="center"><sub>Experimental research prototype. Not a medical device. Not a diagnosis.</sub><br/>
<sub><a href="https://arjunshah.xyz">Arjun Shah</a> · Congressional App Challenge 2026</sub></p>

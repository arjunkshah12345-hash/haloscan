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
  <a href="https://haloscan.ideatr.dev/scan">Live Scanner</a> ·
  <a href="https://haloscan.ideatr.dev/scan?judge=1">Judge Demo</a> ·
  <a href="https://haloscan.ideatr.dev/judges">Judge Guide</a> ·
  <a href="https://www.kaggle.com/code/aks1321/coincell-train-cpu">Training</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/CAC-2026-red?style=flat-square" alt="Congressional App Challenge" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT" />
  <img src="https://img.shields.io/badge/python-3.10+-green?style=flat-square" alt="Python" />
  <img src="https://img.shields.io/badge/battery_sensitivity-100%25-success?style=flat-square" alt="100% battery sensitivity" />
  <img src="https://img.shields.io/badge/Reese's_Law-P.L._117--171-lightgrey?style=flat-square" alt="Reese's Law" />
</p>

---

**Haloscan** is open-source AI decision support that distinguishes **button batteries from coins** on pediatric X-rays — closing the diagnostic gap [Reese's Law](https://www.congress.gov/bill/117th-congress/house-bill/5313) left open.

Congress passed child-proof battery packaging **409–2**. When a disc already sits in a child's esophagus, clinicians still have **~2 hours**. Stacked coins **fake the double halo sign**. Emory's 2020 ML model hit 81% battery sensitivity and **never shipped**. Haloscan does.

<p align="center">
  <a href="https://haloscan.ideatr.dev/scan"><strong>→ Try the live demo</strong></a>
</p>

---

## Why "Haloscan"

Radiologists look for the **double halo** on AP films — bright outer rim, darker center, inner ring — to spot button batteries. **Haloscan** measures that signature with radial intensity profiling, fuses it with a dual-view neural network, and outputs a clinical protocol when the halo lies.

---

## Results

| | Haloscan | Emory 2020 (Rostad et al.) |
|---|:---:|:---:|
| **Battery sensitivity** | **100%** | 81% |
| **Stacked-coin emergency catch** | **65%** | — |
| Coin sensitivity | 73% | 83% |
| Overall accuracy (baseline) | — | 88% |

*Synthetic holdout, n=40/class. See `weights/metrics.json`.*

---

## Quick start

```bash
git clone https://github.com/arjunkshah12345-hash/haloscan.git
cd haloscan
pip install -r requirements.txt
./scripts/run.sh
```

Open **http://localhost:7860** — upload AP + lateral X-rays, get verdict + Grad-CAM + clinical report.

Weights ship in `weights/haloscan.pt`. No API keys. Runs **offline**.

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AP X-ray   │────▶│  Halo analyzer   │────▶│                 │
│  (CLAHE)    │     │  radial profile  │     │   Ensemble      │
└─────────────┘     └──────────────────┘     │   CV 55%        │
┌─────────────┐     ┌──────────────────┐     │   CNN 40%       │──▶ Verdict
│  Lateral    │────▶│  Step-off detect │────▶│   dual bonus    │    Grad-CAM
└─────────────┘     └──────────────────┘     │                 │    Protocol
                              │               └────────▲────────┘
                              └──── DualViewNet ───────┘
                                    (3× battery loss)
```

<details>
<summary><strong>Key modules</strong></summary>

| File | Role |
|------|------|
| `haloscan/halo_analyzer.py` | Radial halo profiling, Hough fallback |
| `haloscan/models.py` | DualViewNet — AP + lateral fusion |
| `haloscan/inference.py` | Ensemble, Grad-CAM, stacked-coin heuristics |
| `haloscan/clinical.py` | CRITICAL / URGENT / ROUTINE protocol engine |
| `haloscan/report.py` | Printable HTML clinical reports |

</details>

---

## Project layout

```
haloscan/          # Python ML + clinical engine
api/               # FastAPI backend
static/            # Full clinical web UI (upload + inference)
website/           # Marketing site → Vercel
weights/           # Bundled model weights (~3.5 MB)
kaggle/            # CPU training notebook
tests/             # Smoke tests
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

Built to connect **federal legislation** (Reese's Law, P.L. 117-171) to an unsolved clinical failure mode with production-grade code.

| Resource | Link |
|----------|------|
| Live demo | https://haloscan.ideatr.dev/scan |
| Judge guide | https://haloscan.ideatr.dev/judges |
| API (Render) | https://haloscan.onrender.com |
| Submission copy | [`SUBMISSION_FORM.md`](SUBMISSION_FORM.md) |
| Video script | [`VIDEO.md`](VIDEO.md) |

---

## Disclaimer

**Decision support / research only.** Not a medical device. Not FDA cleared.

Suspected button battery ingestion → **911** · Poison Control **1-800-222-1222** · Battery Ingestion Hotline **202-625-3333**

---

## License

[MIT](LICENSE) — use it, learn from it, fork it.

<p align="center"><sub>Reese's Law fixed prevention. Haloscan fixes diagnosis.</sub><br/>
<sub><a href="https://arjunshah.xyz">Arjun Shah</a> · Congressional App Challenge 2026</sub></p>

# HaloScan reviewer guide

## Purpose

HaloScan is a student research prototype. It measures synthetic X-ray-style images that contain a drawn button battery, a drawn coin, or drawn stacked coins. It is not a medical device, not FDA-cleared, and not a tool for deciding emergency care.

Suspected button-battery ingestion needs professional emergency evaluation regardless of the score. National Battery Ingestion Hotline: 1-800-498-8666. Poison Help: 1-800-222-1222.

## Live demo

- App: https://haloscan-cac.vercel.app
- Scanner: https://haloscan-cac.vercel.app/scan
- Judge path: https://haloscan-cac.vercel.app/scan?judge=1
- Model page: https://haloscan-cac.vercel.app/architecture
- Evaluation page: https://haloscan-cac.vercel.app/validation

Keys 1–4 load synthetic cases. The badge says "Live inference" only when the API completed a forward pass. If Render is cold or down, the same buttons load a prerecorded synthetic demo and the page says so. That saved JSON was produced earlier by the model. It is not a new pass, and it is not a patient image.

## Source

https://github.com/arjunkshah12345-hash/haloscan

## Architecture

1. Preprocess: grayscale, CLAHE, resize to 224 for the network.
2. Classical branch: circle center, radial intensity profile, halo score, stacked-mimic score (`haloscan/halo_analyzer.py`).
3. Network: `ViewEncoder` channels 3→32→64→128, pool to 128. `DualViewNet` concatenates AP and lateral (or zeros) to 256, then 256→128→3 classes (`haloscan/models.py`).
4. Ensemble (`haloscan/inference.py`): battery score = 0.48·CV + 0.42·CNN + 0.10·(1 − CNN coin), plus 0.06 if the lateral step-off score exceeds 0.35.
5. Ambiguity rules can mark an unresolved halo. They do not issue a treatment order.
6. Grad-CAM and a radial chart are the explanations.

Training mapped stacked coins onto the battery class. The loss weights are `[3.0, 1.0, 0.5]` (battery, coin, normal), the configuration the shipped checkpoint was trained with.

## Reproducible evaluation

```bash
/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m haloscan.eval_suite --n 40
```

Artifact: `docs/eval/eval_report.json`, also copied to `website/public/figures/validation/eval_report.json`.

2026-10-11 CPU holdout, 40 per class, seeds from 500000, weights `56b923a678800093f75934b5fef63085e60cdb174bd51f9b7c1a4d81d5c9574e`:

- AP-only ensemble: battery flag 40/40, coin-like 40/40, stack flagged 35/40.
- AP plus a separate synthetic lateral: battery flag 40/40, coin-like 0/40, stack flagged 35/40.
- Classical CV only: battery flag 5/40, coin-like 40/40, stack flagged 9/40.
- CNN only with laterals: battery flag 40/40, coin-like 0/40, stack flagged 40/40.
- Dropping the ambiguity rules did not change the 35/40 stack-flag count on this set.

A 40/40 rate has a Wilson 95% interval of about 91–100%. These are not clinical sensitivity.

## Original contributions

The generator, the radial analyzer, DualViewNet, the ensemble, Grad-CAM in the scan response, and the web pipeline. See `SUBMISSION_FINAL.md`.

## Limitations

Same-generator images. No external radiographs. Uncalibrated scores. Independent AP and lateral draws rather than a geometric pair. Older docs that compare HaloScan with Emory 2020 are withdrawn as a performance claim. The datasets are not comparable.

## Local setup

Python 3.10+ with the packages in `requirements.txt`. On the machine used for this release, system `python3` lacked OpenCV; the framework Python 3.12 had PyTorch 2.12 and OpenCV 5.

```bash
pip install -r requirements.txt
python3 -m uvicorn api.main:app --port 7860
cd website && npm install && npm run dev
```

Set `HALOSCAN_API_URL=http://127.0.0.1:7860` for the Next.js proxy.

## Provenance

Model file: `weights/haloscan.pt`. Dataset: procedural, `haloscan/synthetic.py`. No patient images are shipped in the training code. Demo images under `website/public/demos` are synthetic.

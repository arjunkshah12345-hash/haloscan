# Congressional App Challenge 2026 — entry draft

Use this draft. Do not paste older paragraphs that say HaloScan fixes diagnosis, beat an Emory study, or passed a clinical test. Personal sentences in brackets are for the student to write. Do not invent them.

Official rules checked 2026-10-11: https://www.congressionalappchallenge.us/wp-content/uploads/2026/05/2026-CAC-Rules.pdf
Deadline: October 26, 2026, 12:00 pm Eastern. Video: 1–3 minutes. AI tools are allowed if disclosed.

## App name

HaloScan

## Short description

HaloScan is an experimental research prototype that studies how a small neural network and a radial image measurement describe button-battery-like and coin-like patterns on synthetic X-ray images. It is not a medical device and it does not diagnose.

## Problem and purpose

A button battery lodged in a child's esophagus can injure tissue quickly. On an X-ray, a battery can look like a coin, and stacked coins can copy the ring people associate with a battery. Reese's Law (Public Law 117-171, August 16, 2022) requires safer packaging, warning labels, and battery compartments. It does not tell a clinician what an X-ray shows, and it does not authorize software to make that call.

HaloScan exists to show a student-built measurement pipeline: classical radial profiling, a dual-view convolutional network, and an ensemble that reports uncertainty. If someone suspects a child swallowed a battery, they need emergency care regardless of this app. National Battery Ingestion Hotline: 1-800-498-8666. Poison Help: 1-800-222-1222.

## Intended audience

Judges and students who want to see the engineering. Clinicians are not the users. The app must not be used to decide whether a child can go home.

## Personal motivation

[Student: write this in your own words. Say why you chose the problem. Do not copy a story you did not live. If you used published papers or news about Reese Hamsmith and button-battery injuries, say that those were sources, not personal events.]

## Original technical contributions

From the repository history and the code, the project contributes:

- A procedural generator for battery, coin, stacked-coin, and empty backgrounds (`haloscan/synthetic.py`).
- A radial halo analyzer (`haloscan/halo_analyzer.py`).
- `DualViewNet`, a small PyTorch network with two encoders (`haloscan/models.py`).
- An ensemble that mixes the classical scores and the network scores, with an ambiguity rule (`haloscan/inference.py`).
- Grad-CAM and a radial chart on each scan.
- A FastAPI service and a Next.js scanner that can run the model or, if the API is down, show a labeled prerecorded synthetic demo.

Third-party pieces include PyTorch, OpenCV, FastAPI, Next.js, and the published idea of a double-halo sign in the radiology literature. The Emory 2020 YOLOv2 abstract is background reading. HaloScan does not extend that codebase and does not claim to beat it.

## Challenges

The images are easy for a model in a way real radiographs are not: batteries are drawn as rings and coins as flat discs. A number that looks perfect on those drawings does not survive contact with a second view. On the 2026-10-11 holdout, DualViewNet alone called every synthetic coin battery-like when a separately drawn lateral was attached (coin-pattern rate 0/40). Classical AP profiling and AP-only CNN still separated coins. As of 2026-10-12 the ensemble applies a dual-view collapse guard: when DualViewNet predicts battery but AP-only CNN and classical agree on coin, fusion uses the AP-only network scores. The `cnn_only` ablation still reports the raw DualViewNet failure. With the guard, AP+lateral ensemble coin-pattern rate is 40/40 on the refreshed holdout; stacked-coin research flags remain 35/40 (87.5%); battery flags 40/40 (Wilson 95% still starts near 91%).

## Algorithms and tools

Python, PyTorch, OpenCV, NumPy, Pillow, Matplotlib, FastAPI, Next.js, TypeScript. Training used a weighted cross-entropy (`[3.0, 1.0, 0.5]` for battery, coin, normal, the configuration the shipped checkpoint was trained with). Stacked coins were mapped onto the battery class during training, so the network was not asked to learn a separate stack class. Fusion weights in the current ensemble are 0.48 classical, 0.42 network, and a small term on the network's coin score, plus 0.06 if a lateral step-off score is above 0.35.

## Testing and outcomes

Commands and results are in `docs/RELEASE_VERIFICATION.md`. The reproducible report is `docs/eval/eval_report.json` (weights SHA-256 `56b923a678800093f75934b5fef63085e60cdb174bd51f9b7c1a4d81d5c9574e`). Reproduce with:

```bash
/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 -m haloscan.eval_suite --n 40
```

That interpreter is the one on the development machine that has PyTorch 2.12 and OpenCV 5. The default `python3` on that machine did not have OpenCV.

## Limitations and future work

No real pediatric radiographs were evaluated. Scores are not calibrated probabilities. The generator and the training distribution are the same family, and training was not a locked seed, so this holdout is a fresh draw rather than a file of images withheld at training time. A useful 2.0 would lock the split, draw true projective pairs, keep stacked coins as their own class, and only then look for a licensed external image set.

## AI assistance disclosure

AI coding tools were used to audit the repository, rewrite unsafe medical wording, add the evaluation suite, adjust the scanner, and draft these submission files. The student should name the tools they actually used, including any help before this release. The model weights, the generator, and the original network were already in the repository. AI assistance does not turn synthetic scores into clinical evidence.

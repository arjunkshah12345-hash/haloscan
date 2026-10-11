# HaloScan final audit

Date: 2026-10-11. Commit inspected before this release work: `801841c`. This audit describes what the code does. It is not a clinical validation.

## Verified working features

- `haloscan/synthetic.py` draws grayscale discs: concentric rings for a button battery, a flat disc for a coin, copied rings plus an offset rim for stacked coins, and a stick-figure background.
- `haloscan/halo_analyzer.py` runs CLAHE, finds a circle, samples a radial profile, and scores a halo and a stacked-coin mimic.
- `haloscan/models.py` defines `ViewEncoder` (3→32→64→128, adaptive pool to 128) and `DualViewNet` (two encoders, concat to 256, linear 256→128→3). A missing lateral is a zero vector.
- `weights/haloscan.pt` loads. SHA-256 `56b923a678800093f75934b5fef63085e60cdb174bd51f9b7c1a4d81d5c9574e`.
- `HaloscanEngine.analyze` returns a class score, CV scores, CNN softmax, a radial chart, an overlay, and Grad-CAM when `explain=True`.
- Smoke inference on 2026-10-11: a synthetic battery with a lateral raised the research flag; an AP-only coin was called coin-like and was not flagged; a stacked-coin image was flagged or marked ambiguous.
- FastAPI exposes `/api/health`, `/api/analyze`, `/api/demo/{case}`, and `/api/report`. The Next.js app proxies those routes and can fall back to prerecorded demo JSON.
- The live hosts answered before this release: `https://haloscan-cac.vercel.app` and `https://haloscan.onrender.com`. Production does not yet include the changes in this working tree until they are deployed.

## Confirmed defects

- The published `weights/metrics.json` figures (100% battery, 100% coin, 95% stacked, and `beats_baseline_battery_sensitivity: true`) are not a clinical result and are not a comparison with Emory 2020. Re-running the shipped weights on 2026-10-11 did not reproduce the coin figure once a synthetic lateral was attached.
- `clinical.py` used to emit CRITICAL / URGENT / ROUTINE orders, including discharge language for a coin-like score. That was individualized management. This release replaces it with a research readout. The safety line still says, in words, that the app must not recommend discharge.
- The old hotline string `202-625-3333` does not match the number the National Capital Poison Center publishes. The current National Battery Ingestion Hotline is 1-800-498-8666 (`https://www.poison.org/battery`, checked 2026-10-11). Poison Help remains 1-800-222-1222.
- Reese's Law was described as a 409–2 House vote and as something HaloScan "fixes" on the diagnosis side. Congress.gov shows H.R. 5313 became Public Law 117-171 on August 16, 2022. GovTrack records House passage under suspension of the rules and Senate passage by unanimous consent, not a recorded 409–2 vote. The statute is about packaging, labels, and compartments.
- The website demo route preferred static JSON and the scanner said "live inference" even when no new forward pass ran.
- Training (`classifier.build_dataset`) does not use a fixed seed, and stacked coins are labeled as the battery class. The CNN is taught that stacks are batteries.
- AP and lateral pairs are independent draws, not two projections of one object.
- Uploads were accepted up to 20 MB with no content-type check and no decompression-bomb cap.

## Unverified features

- Production behavior after this working tree is deployed. The public site still serves the previous build until a deploy.
- Whether a judge's browser on a phone completes the dark scanner layout. Desktop build is checked in `docs/RELEASE_VERIFICATION.md`. A full mobile pass in a real browser was not completed in this session.
- Dependency CVE scan with a dedicated auditor. No `pip-audit` or `npm audit` clean bill is claimed.
- HIPAA, FDA clearance, and any security certification. None of those exist for this project.

## ML limitations

Holdout on 2026-10-11, 40 images per class, seeds from 500000, CPU, `explain=False` except one timed Grad-CAM sample. Full rows are in `docs/eval/eval_report.json`.

| Configuration | Battery research flag | Coin-like pattern | Stack flagged |
|---|---:|---:|---:|
| CNN only (lateral when the class has one) | 40/40 | 0/40 | 40/40 |
| Classical CV only | 5/40 (0.125) | 40/40 | 9/40 (0.225) |
| Full ensemble, AP + lateral | 40/40 | 0/40 | 35/40 (0.875) |
| Ensemble, AP only | 40/40 | 40/40 | 35/40 (0.875) |
| Ensemble without ambiguity rules | 40/40 | 0/40 | 35/40 (0.875) |

Wilson 95% interval for 40/40 is about 0.912 to 1.0. For 35/40 it is about 0.739 to 0.945.

The classical branch separates flat coins from rings. The CNN, once a synthetic lateral is attached, calls coins batteries (softmax coin near 0). The ensemble follows the CNN, so the paired protocol loses coin discrimination. The ambiguity rules did not change the stack-flag count on this holdout. A shifted generator (smaller frame, edge placement, gamma, JPEG, noise, a dark bar) still flagged 40/40 batteries and 36/40 stacks, and still called 0/40 paired coins coin-like.

Battery-flag versus coin-and-normal on the paired holdout: precision 0.494, recall 1.0, specificity 0.488, F1 0.661, with 41 false flags. That is the cost of calling every paired coin a battery.

CPU latency without Grad-CAM: p50 37 ms, p95 45 ms. One sample with Grad-CAM: 405 ms.

No licensed, de-identified pediatric radiograph set was in the repository. No external clinical evaluation was run.

## Deployment issues

- Render cold starts. The scanner now keeps prerecorded demos available and labels them.
- CORS previously allowed every origin. It is now limited to the Vercel app, preview hosts matching `haloscan*.vercel.app`, and local dev ports.
- As of 2026-10-11 evening, Vercel serves the research UI; Render `/api/health` still reports version **2.2.0** while the repo is **2.4.0**. The Next.js proxy rewrites labels until Render is redeployed. Render CLI auth on the release machine is expired (`render login` required).
- `weights/metrics.json` in the repo no longer claims Emory outperformance. The public site prefers `eval_report.json` for `/api/metrics`.

## Security and privacy

- Images are decoded with Pillow after a verify step, capped at 8 MB and 16 million pixels, and downscaled past 1024 px.
- Non-image content types are rejected. A garbage payload returns a generic 400.
- Analyze and demo routes use a simple in-memory rate limit. It resets when the process restarts and is not a global limiter across Render instances.
- Analysis errors return a fixed sentence. They do not return a stack trace to the client.
- The app does not create accounts, does not add an analytics tracker, and does not claim to store uploads. Render and Vercel may still log requests under their own policies.
- This is not a HIPAA review and not a penetration test.

## Required submission fixes

- Use `SUBMISSION_FINAL.md` and `VIDEO_FINAL.md`, not the older copy that says the app fixes diagnosis or beats Emory.
- Say the work is a student research prototype. Disclose AI assistance. The student must add their own motivation in their own words.
- Do not submit the Congressional App Challenge form until the student has watched the deployed scanner and checked the video against the live app.
- Deadline from the 2026 rules PDF: October 26, 2026, 12:00 pm Eastern. Video 1–3 minutes. AI use is allowed if disclosed. Eligibility is middle or high school enrollment on that date, in one district where the student lives or attends school.

## Lower-priority enhancements

- Retrain with a locked split, realistic projective AP/lateral pairs, and stacked coins as their own class.
- Calibrate scores before anyone is tempted to read them as probabilities.
- Replace the hand-drawn generator with a properly licensed external set, if one can be obtained without dragging in patient data.
- Add a real mobile browser pass and a dependency audit.

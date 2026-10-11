# Release verification

Date: 2026-10-11. Machine: macOS. Python: `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3` (PyTorch and OpenCV). The default `python3` on this machine does not have OpenCV and cannot run the suite.

## Commands that passed

`tests/test_release.py` — all four checks printed `ok`:

- Wilson interval for 40/40 is not a single point.
- Research notes do not contain discharge, NPO, or endoscopy orders.
- Shifted sample stays in `[0, 1]` at 288×288.
- `decode_image_bytes` rejects garbage (400), oversize (413), and `text/html` (415), and accepts a 16×16 PNG.

`tests/smoke_test.py` — all six checks printed a check mark, including `test_inference_pipeline` (synthetic battery flagged, AP-only coin called coin-like and not flagged, stacked image flagged or ambiguous).

`python3 -m haloscan.eval_suite --n 40` — completed and wrote `docs/eval/eval_report.json` and `website/public/figures/validation/ablation.png`. Provenance in that file: weights SHA-256 `56b923a678800093f75934b5fef63085e60cdb174bd51f9b7c1a4d81d5c9574e`, git commit `801841c` (parent of this working tree), CPU, p50 37.33 ms and p95 45.34 ms without Grad-CAM, 405.12 ms for one explained sample.

Holdout rates from that file:

- Ensemble with lateral: battery flag 1.0 (Wilson 0.9124–1.0), coin pattern 0.0, stacked flag 0.875 (35/40, Wilson 0.7388–0.9454).
- AP-only ensemble: coin pattern 1.0.
- CV only: battery flag 0.125, coin pattern 1.0, stacked flag 0.225.
- CNN only with lateral: battery flag 1.0, coin pattern 0.0, stacked flag 1.0.
- Ambiguity rules removed: same 0.875 stacked flag as the full ensemble.
- Shifted ensemble: battery flag 1.0, coin pattern 0.0, stacked flag 0.9.

`cd website && npm install && npx next build` — exit 0. Next.js 15.5.23 compiled and generated 12 static pages, including `/`, `/scan`, `/architecture`, `/validation`, and `/judges`. `npm audit` reported 4 vulnerabilities (3 high, 1 critical). Not treated as a clean bill.

## Live hosts, current production (not this working tree)

Checked with curl on 2026-10-11:

| URL | HTTP |
|---|---|
| https://haloscan-cac.vercel.app | 200 |
| https://haloscan-cac.vercel.app/scan | 200 |
| https://haloscan-cac.vercel.app/scan?judge=1 | 200 |
| https://haloscan-cac.vercel.app/architecture | 200 |
| https://haloscan-cac.vercel.app/validation | 200 |
| https://haloscan-cac.vercel.app/judges | 200 |
| https://haloscan.onrender.com/api/health | 200, `{"status":"ok","version":"2.2.0","model":"loaded"}` |

Live demo forward passes on the deployed API (version 2.2.0, still the old protocol):

- battery: prediction BATTERY, emergency true, urgency CRITICAL, about 15 s (cold-ish).
- coin: prediction COIN, emergency false, urgency ROUTINE, about 9 s.
- stacked: prediction BATTERY, emergency true, urgency CRITICAL, about 8 s.

Those responses still use the old clinical labels. This working tree replaces them, and production will not until the branch is deployed.

## Not done

- No browser click-through of the new scanner. The production site is the previous UI. A local browser pass of the new build was not run.
- No phone viewport check.
- No `pip-audit`.
- The Congressional App Challenge form was not submitted.

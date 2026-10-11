# Release verification

Date: 2026-10-11 (updated after `release/cac-2026-final`). Machine: macOS.

Python for ML tests: `/Library/Frameworks/Python.framework/Versions/3.12/bin/python3` (PyTorch and OpenCV). The default `python3` on this machine may not have OpenCV.

## Commands that passed in the integrity / scanner work

`tests/test_release.py` — Wilson interval, research notes without discharge/NPO/endoscopy orders, shifted sample bounds, upload decode rejects.

`tests/smoke_test.py` — inference pipeline on synthetic battery / coin / stacked.

`python3 -m haloscan.eval_suite --n 40` — wrote `docs/eval/eval_report.json`. Provenance: weights SHA-256 `56b923a678800093f75934b5fef63085e60cdb174bd51f9b7c1a4d81d5c9574e`, git commit `801841c` at suite run time, CPU latency p50 ~37 ms without Grad-CAM.

Holdout summary (synthetic, n=40/class):

| Configuration | Battery research flag | Coin-like | Stack flagged |
|---|---:|---:|---:|
| Full ensemble, AP + lateral | 40/40 | 0/40 | 35/40 |
| Ensemble, AP only | 40/40 | 40/40 | 35/40 |
| Classical CV only | 5/40 | 40/40 | 9/40 |
| CNN only with lateral | 40/40 | 0/40 | 40/40 |

`cd website && npx next build` — exit 0 on 2026-10-11 (Next.js 15.5.23). `npm audit` reported 4 vulnerabilities (3 high, 1 critical) in existing dependencies; not auto-fixed.

## Live hosts checked 2026-10-11 (this session)

| URL | HTTP | Notes |
|---|---|---|
| https://haloscan-cac.vercel.app | 200 | Home leads with synthetic holdout |
| https://haloscan-cac.vercel.app/scan | 200 | Scanner workstation UI |
| https://haloscan-cac.vercel.app/scan?judge=1 | 200 | Judge query works |
| https://haloscan-cac.vercel.app/api/health | 200 | Proxied; reports API `version` **2.2.0** |
| https://haloscan.onrender.com/api/health | 200 | `{"status":"ok","version":"2.2.0","model":"loaded"}` |
| https://haloscan.onrender.com/health | 404 | Correct; health is under `/api/health` |

Repo `api/main.py` declares version **2.4.0**. Production Render is still **2.2.0**, so the site keeps rewriting research labels in the Next.js proxy (`website/app/api/[...path]/route.ts`). A manual Render deploy of `main` after this PR merges is required for the API process itself to serve the research protocol.

Render CLI on this machine: `Error: your token is expired; run render login`. Dashboard service ID from `DEPLOY.md`: `srv-da4tc1jm8hqs73anthk0`.

## This branch (`release/cac-2026-final`) adds

- Prerecorded demo JSON protocols rewritten (no CRITICAL/ROUTINE, hotline 1-800-498-8666).
- README / TECHNICAL / CHECKLIST aligned with research positioning; old form/video/win drafts marked superseded.
- Architecture diagram and unused HeroLaunch copy corrected.
- `weights/metrics.json` no longer claims Emory outperformance (duplicate key removed).
- `*.tsbuildinfo` ignored.

Re-run after merge:

```bash
/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 tests/smoke_test.py
/Library/Frameworks/Python.framework/Versions/3.12/bin/python3 tests/test_release.py
cd website && npx next build
curl -sS https://haloscan.onrender.com/api/health   # expect version 2.4.0 after Render redeploy
```

## Not done

- Render redeploy (CLI token expired; needs `render login` then `render deploys create srv-da4tc1jm8hqs73anthk0 --confirm`).
- Student phone browser pass.
- Student video recording and portal submit.
- `pip-audit` clean bill (not claimed).

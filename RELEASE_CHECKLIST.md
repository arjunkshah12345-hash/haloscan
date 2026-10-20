# Release checklist

Checked items were verified. Unchecked items were not. Updated 2026-10-19 after Render 2.5.0 and the judge-feedback release.

## Product

- [x] Scanner code no longer presents CRITICAL / URGENT / ROUTINE as care orders.
- [x] Safety banner states that suspected ingestion needs emergency care regardless of the score.
- [x] Hotline in the research readout is 1-800-498-8666, matching poison.org on 2026-10-11.
- [x] Reese's Law copy describes packaging and compartments, not a diagnostic claim, and does not repeat an unverified 409–2 vote as the authoritative story.
- [x] Demo responses are labeled live or prerecorded (proxy + demo JSON).
- [x] Bundled demo JSON protocols no longer contain CRITICAL/ROUTINE or the old 202-625-3333 hotline.
- [x] Uploads are limited to 4 MB combined in the browser (Vercel rejects larger request bodies; the API itself allows 8 MB) and rejected when they are not images.
- [x] Automated production click-through on 2026-10-19 (Playwright + Chrome, fresh contexts, desktop 1366px and iPhone 13 emulation, against haloscan-cac.vercel.app with Render 2.5.0): Cases A, B, C each returned **Live inference** with Grad-CAM and radial chart loaded; Case B used the dual-view path and stayed coin-like; no page errors; no horizontal overflow.
- [x] Upload checks on production 2026-10-19: valid AP and AP+lateral uploads return live results; a corrupt file shows "Could not read that file as an image."; an oversized file is rejected before upload. With the API unreachable (preview build), every case is labeled **Prerecorded demo** and uploads show an error instead of a substituted result.
- [x] Under concurrent load the free Render CPU can exceed the 50 s proxy timeout; cases then fall back to a result labeled **Prerecorded demo** (observed and correctly labeled 2026-10-19). Run cases one at a time when recording.
- [ ] Student has clicked through the deployed production scanner by hand.
- [ ] Mobile layout checked in a real phone browser (only emulation was tested).

## Science

- [x] `python3 -m haloscan.eval_suite --n 40` completed on CPU and wrote `docs/eval/eval_report.json`.
- [x] Report includes holdout, shifted set, ablations, Wilson intervals, confusion counts, latency, weights hash.
- [x] Results contradict the old 100% coin / beats-Emory claim when laterals are included. Documented, not hidden.
- [x] `weights/metrics.json` and public `figures/validation/metrics.json` no longer set `beats_baseline_battery_sensitivity: true`.
- [x] No external clinical dataset was run, and the docs say so.
- [ ] A future training run uses a locked seed and does not reuse evaluation seeds at or above 500000.

## Tests

- [x] `tests/smoke_test.py` — see `docs/RELEASE_VERIFICATION.md`.
- [x] `tests/test_release.py` — same.
- [x] Frontend production build — `cd website && npx next build` exited 0 on 2026-10-11. `npm audit` still reported vulnerabilities in existing deps.

## Submission

- [x] `SUBMISSION_FINAL.md`, `VIDEO_FINAL.md`, and `JUDGE_GUIDE.md` exist and avoid a clinical-superiority claim.
- [x] Older `SUBMISSION_FORM.md` / `VIDEO.md` / `WIN.md` marked superseded.
- [x] AI assistance is disclosed as a draft the student must personalize.
- [ ] Student records the video from the deployed app.
- [ ] Student confirms eligibility, district, and team facts.
- [ ] Student submits the form themselves. This repository does not submit it.
- [x] Production Render API redeployed to **2.5.0** on 2026-10-19 (manual deploy; the service's GitHub auto-deploy has never fired, so redeploy by hand after each API change). `/api/health` and `/api/metrics` return 200.
- [x] Vercel production is a manual CLI deploy from `website/`; `haloscan-cac.vercel.app` is a manually set alias and must be re-pointed (`vercel alias set <deployment> haloscan-cac.vercel.app`) after each `vercel --prod`.
- [x] Dual-view coin collapse reproduced and documented; ensemble guard + `cnn_only` ablation retained.

## Not claimed

- [ ] FDA clearance
- [ ] HIPAA compliance
- [ ] Clinical accuracy
- [ ] Outperformance of the Emory 2020 study

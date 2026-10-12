# Release checklist

Checked items were verified. Unchecked items were not. Updated 2026-10-11 for `release/cac-2026-final`.

## Product

- [x] Scanner code no longer presents CRITICAL / URGENT / ROUTINE as care orders.
- [x] Safety banner states that suspected ingestion needs emergency care regardless of the score.
- [x] Hotline in the research readout is 1-800-498-8666, matching poison.org on 2026-10-11.
- [x] Reese's Law copy describes packaging and compartments, not a diagnostic claim, and does not repeat an unverified 409–2 vote as the authoritative story.
- [x] Demo responses are labeled live or prerecorded (proxy + demo JSON).
- [x] Bundled demo JSON protocols no longer contain CRITICAL/ROUTINE or the old 202-625-3333 hotline.
- [x] Uploads are limited to 8 MB images and rejected when they are not images.
- [ ] Student has clicked through the deployed production scanner after this branch is deployed.
- [ ] Mobile layout checked in a real phone browser.

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
- [x] Production Render API previously verified at 2.4.0; this branch bumps API to **2.5.0** (metrics never recompute online; dual-view collapse guard). Redeploy Render after merge.
- [x] Dual-view coin collapse reproduced and documented; ensemble guard + `cnn_only` ablation retained.

## Not claimed

- [ ] FDA clearance
- [ ] HIPAA compliance
- [ ] Clinical accuracy
- [ ] Outperformance of the Emory 2020 study

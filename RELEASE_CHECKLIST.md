# Release checklist

Checked items were verified in this session on 2026-10-11. Unchecked items were not.

## Product

- [x] Scanner code no longer presents CRITICAL / URGENT / ROUTINE as care orders.
- [x] Safety banner states that suspected ingestion needs emergency care regardless of the score.
- [x] Hotline in the new readout is 1-800-498-8666, matching poison.org on 2026-10-11.
- [x] Reese's Law copy describes packaging and compartments, not a diagnostic claim, and does not repeat an unverified 409–2 vote.
- [x] Demo responses are labeled live or prerecorded.
- [x] Uploads are limited to 8 MB images and rejected when they are not images.
- [ ] Student has clicked through the deployed production scanner after this branch is deployed.
- [ ] Mobile layout checked in a real phone browser.

## Science

- [x] `python3 -m haloscan.eval_suite --n 40` completed on CPU (framework Python 3.12) and wrote `docs/eval/eval_report.json`.
- [x] Report includes holdout, shifted set, ablations, Wilson intervals, confusion counts, latency, weights hash, and git commit `801841c` (the commit before these edits; the hash will change when this work is committed).
- [x] Results contradict the old 100% coin / beats-Emory claim when laterals are included. The contradiction is documented, not hidden.
- [x] No external clinical dataset was run, and the docs say so.
- [ ] A future training run uses a locked seed and does not reuse evaluation seeds at or above 500000.

## Tests

- [x] `tests/smoke_test.py` — see `docs/RELEASE_VERIFICATION.md` after the rerun.
- [x] `tests/test_release.py` — same.
- [x] Frontend production build — `cd website && npx next build` exited 0 on 2026-10-11 (Next.js 15.5.23). `npm audit` reported 4 vulnerabilities (3 high, 1 critical) in existing dependencies. They were not auto-fixed.

## Submission

- [x] `SUBMISSION_FINAL.md`, `VIDEO_FINAL.md`, and `JUDGE_GUIDE.md` exist and avoid a clinical-superiority claim.
- [x] AI assistance is disclosed as a draft the student must personalize.
- [ ] Student records the video from the deployed app.
- [ ] Student confirms eligibility, district, and team facts.
- [ ] Student submits the form themselves. This repository does not submit it.
- [ ] Production deploy matches the commit that was tested.

## Not claimed

- [ ] FDA clearance
- [ ] HIPAA compliance
- [ ] Clinical accuracy
- [ ] Outperformance of the Emory 2020 study

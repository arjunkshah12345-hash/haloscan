# Haloscan — Pre-Submit Checklist

**Deadline: October 26, 2026 · 12:00 PM Eastern**

Authoritative tracked checklist: [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).

---

## Done in repo / deploy (verified 2026-10-11 unless noted)

- [x] Live scanner UI: https://haloscan-cac.vercel.app/scan
- [x] Judge auto-demo: https://haloscan-cac.vercel.app/scan?judge=1
- [x] Architecture / validation / gallery / methodology pages
- [x] GitHub: https://github.com/arjunkshah12345-hash/haloscan
- [x] Synthetic evaluation suite + `docs/eval/eval_report.json` (honest holdout; not clinical)
- [x] Research readout (no CRITICAL / URGENT / ROUTINE care orders in current code)
- [x] Submission drafts: `SUBMISSION_FINAL.md`, `VIDEO_FINAL.md`, `JUDGE_GUIDE.md`
- [ ] Render API redeploy of `main` so `/api/health` reports version **2.4.0** (still **2.2.0** live; CLI token expired)

---

## Student must finish before submit

- [ ] Click through the deployed scanner after the final Vercel deploy of this branch
- [ ] Mobile layout check on a real phone
- [ ] Record the 1–3 minute video from [`VIDEO_FINAL.md`](VIDEO_FINAL.md) against the live app
- [ ] Upload video to YouTube (public or unlisted)
- [ ] Personalize and paste from [`SUBMISSION_FINAL.md`](SUBMISSION_FINAL.md) — not `SUBMISSION_FORM.md`
- [ ] Confirm eligibility, district, and AI-disclosure wording in your own words
- [ ] Submit the Congressional App Challenge form yourself
- [ ] Exit questionnaire after submit

---

## Quick test

```bash
curl -sS https://haloscan.onrender.com/api/health
curl -sS https://haloscan-cac.vercel.app/api/health
curl -sS https://haloscan-cac.vercel.app/api/demo/stacked | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("inference_source"), (d.get("protocol") or {}).get("urgency"))'
python3 tests/smoke_test.py
python3 tests/test_release.py
cd website && npx next build
```

## Submission URLs

| Field | URL |
|-------|-----|
| Live app | https://haloscan-cac.vercel.app/scan |
| Judge demo | https://haloscan-cac.vercel.app/scan?judge=1 |
| Website | https://haloscan-cac.vercel.app |
| GitHub | https://github.com/arjunkshah12345-hash/haloscan |

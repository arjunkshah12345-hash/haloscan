# Haloscan — Pre-Submit Checklist

**Deadline: October 26, 2026 · 12:00 PM Eastern**

---

## Done ✅

- [x] **Live scanner:** https://haloscan.ideatr.dev/scan
- [x] **Judge auto-demo:** https://haloscan.ideatr.dev/scan?judge=1
- [x] **API (Render):** https://haloscan.onrender.com
- [x] **Architecture / validation / gallery / methodology**
- [x] **GitHub:** https://github.com/arjunkshah12345-hash/haloscan
- [x] 100% battery sensitivity vs 81% Emory baseline
- [x] Render keepalive cron
- [x] Judge demo mode + pipeline loader + metrics sidebar

---

## Before submit

- [ ] Open `/scan?judge=1` — watch Cases 1 + 3 run automatically
- [ ] Record 2-min video (voiceover over judge demo + Grad-CAM)
- [ ] Upload video to YouTube (public/unlisted)
- [ ] Submit form using `SUBMISSION_FORM.md`
- [ ] Exit questionnaire after submit

---

## Quick test

```bash
curl https://haloscan.onrender.com/api/health
curl -s https://haloscan.ideatr.dev/api/demo/stacked | head -c 120
python3 tests/smoke_test.py
cd website && vercel --prod
```

## Submission URLs

| Field | URL |
|-------|-----|
| Live app | https://haloscan.ideatr.dev/scan |
| Judge demo | https://haloscan.ideatr.dev/scan?judge=1 |
| Website | https://haloscan.ideatr.dev |
| GitHub | https://github.com/arjunkshah12345-hash/haloscan |

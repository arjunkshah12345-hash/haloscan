# Congressional App Challenge 2026 — readiness package

Updated: 2026-10-12. Live site: https://haloscan-cac.vercel.app  
Source: https://github.com/arjunkshah12345-hash/haloscan  
Deadline: October 26, 2026, 12:00 pm Eastern (official rules PDF).

## A. Project description (portal draft)

Use `SUBMISSION_FINAL.md`. Personal motivation still needs the student's own words.

HaloScan is an experimental research prototype that studies button-battery-like and coin-like patterns on synthetic X-ray images using classical radial profiling and a dual-view neural network. It is not a medical device and it does not diagnose.

## B. Technical explanation

- Generator: `haloscan/synthetic.py`
- Classical branch: `haloscan/halo_analyzer.py`
- Network: `DualViewNet` in `haloscan/models.py`
- Fusion + dual-view collapse guard: `haloscan/inference.py`
- Evaluation: `python3 -m haloscan.eval_suite --n 40` → `docs/eval/eval_report.json`
- API: FastAPI `api/main.py` (v2.5.0) · Frontend: Next.js `website/`

## C. Challenges overcome

DualViewNet, given independently drawn synthetic laterals, collapsed the coin class to ~1.0 battery probability (reproduced 2026-10-11 and 2026-10-12). Classical CV and AP-only CNN still separated coins. The ensemble now gates DualViewNet when it contradicts both AP-only CNN and classical coin evidence. The `cnn_only` ablation still reports the raw failure (0/40 coin pattern).

## D. Demonstration video plan (2:20 target)

Follow `VIDEO_FINAL.md`. Record from the deployed app after this release:

| Time | Content |
|------|---------|
| 0:00–0:20 | Name, HaloScan, synthetic research prototype, not a medical device |
| 0:20–0:45 | Button-battery urgency + Reese's Law is packaging, not a diagnostic test |
| 0:45–1:30 | Scanner Cases A → B → C; live vs prerecorded badges; charts |
| 1:30–2:05 | Architecture: OpenCV + DualViewNet + guard; point at scores |
| 2:05–2:35 | Holdout metrics, DualViewNet failure, ensemble recovery, no clinical claim |
| 2:35–3:00 | Hotline, limitations, GitHub |

## E. Submission asset checklist

- [ ] Live app: https://haloscan-cac.vercel.app
- [ ] Judge demo: https://haloscan-cac.vercel.app/scan?judge=1
- [ ] Judge guide: https://haloscan-cac.vercel.app/judges
- [ ] Source: https://github.com/arjunkshah12345-hash/haloscan (public)
- [ ] Form text from `SUBMISSION_FINAL.md` (not superseded `SUBMISSION_FORM.md`)
- [ ] YouTube video 1–3 minutes (student records — not done by agents)
- [ ] Eligibility / district / team confirmed by student
- [ ] Portal submit by student before Oct 26, 2026 12:00 pm ET

## Before / after evaluation (synthetic holdout, n=40/class)

| Measure | Before (2026-10-11, dual CNN unguarded in ensemble) | After (2026-10-12 ensemble + guard) |
|---------|-----------------------------------------------------|--------------------------------------|
| Battery research-flag rate | 40/40 | 40/40 |
| Coin-pattern rate (AP+lateral ensemble) | **0/40** | **40/40** |
| Stacked research-flag rate | 35/40 | 35/40 |
| cnn_only coin-pattern (raw DualViewNet) | 0/40 | **still 0/40** (honest ablation) |
| Battery flag vs coin+normal F1 | ~0.66 (many FP) | ~0.99 (fp mostly normals) |

Reproduce: `python3 -m haloscan.eval_suite --n 40`

## Remaining risks

- Render cold starts (~30–60s); demos may show labeled prerecorded fallback; uploads require live API.
- No real radiographs. Synthetic scores are not clinical accuracy.
- Student video and portal submit are still outstanding.
- PR merge to `main` may lag the Vercel production alias if deploying from the redesign branch.

# How to Win with Haloscan

> **Partially outdated.** Prefer [`JUDGE_GUIDE.md`](JUDGE_GUIDE.md), [`SUBMISSION_FINAL.md`](SUBMISSION_FINAL.md), and [`VIDEO_FINAL.md`](VIDEO_FINAL.md).
> Do not use the 409–2 vote claim, CRITICAL-protocol demo language, or Emory-outperformance talking points in this file.

You're not competing nationally. You need to **win your district** — typically 20–80 apps. Haloscan is built to score high on all three rubric criteria. This doc tells you exactly how to maximize each.

---

## The rubric (what judges actually score)

| Criterion | Weight in practice | Haloscan's ace |
|-----------|-------------------|----------------|
| **Quality of idea** | High | Reese's Law (409–2 House) + lethal 2-hour window + research never shipped |
| **Implementation** | High | Live web app, dark clinical UI, reports, mobile-responsive |
| **Coding depth** | High | Dual-view CNN, OpenCV halo physics, Grad-CAM, ensemble, benchmarks |

Judges watch your **video first**, then read your **written answers**, then optionally **open your demo**. All three must align.

---

## Why Haloscan beats typical district competitors

Most CAC apps in 2024–2025:
- Todo apps, study planners, mental health journals
- "We used ChatGPT API" wrappers
- Maps with pins
- Forms that don't work live

Haloscan is different because:
1. **Congress already passed a law** on this problem — you finish what they started
2. **Real ML** — not an API call; ensemble CV + PyTorch with explainability
3. **Live demo that works** — judges can upload an image and get a result in 5 seconds
4. **Hard technical problem named** — stacked-coin false halos (shows you understand the domain)
5. **Clinical protocol output** — not just a label; actionable ER checklist

---

## Your 3-minute video (this decides everything)

**Judges are NOT grading cinematography.** They grade clarity.

### Must-show shots (in order)

| Time | Shot | Say this |
|------|------|----------|
| 0:00 | Black screen → text "409–2" | "Congress passed Reese's Law 409 to 2. It fixed battery packaging. Not diagnosis." |
| 0:15 | Haloscan homepage | "Haloscan is AI that tells ER doctors if a swallowed disc is a battery or a coin." |
| 0:25 | Click **Battery** demo | "Watch — halo detected, CRITICAL protocol, 2-hour window." |
| 0:45 | Click **Stacked coins** | "This is the hard case. Stacked coins fake the halo. Haloscan still flags emergency." |
| 1:00 | Show Grad-CAM + radial chart | "Grad-CAM shows what the model sees. Radial profile quantifies the halo sign." |
| 1:15 | 10-sec code: `dual_model.py` | "Dual-view fusion — AP and lateral encoders. Battery-weighted loss." |
| 1:30 | Metrics panel | "We benchmark against Emory 2020 — 81% sensitivity baseline." |
| 1:45 | Download report click | "Clinicians get a full HTML report with protocol and hotlines." |
| 2:00 | Close on live URL | "Haloscan. GitHub and demo linked. Congressional App Challenge 2026." |

**Total: 2:00–2:30.** Leave buffer. Never exceed 3:00.

### Video mistakes that lose

- ❌ Long intro about yourself (10 sec max on who you are)
- ❌ Explaining PyTorch installation
- ❌ No live demo — only slides
- ❌ Generic "AI helps healthcare" without Reese's Law hook
- ❌ Video over 3 minutes

---

## Written answers strategy

Judges read **technical difficulty** answer most carefully for coding score.

**Your killer sentence:**
> "Stacked coins mimic the double halo sign — I solved this with dual-view fusion and an ambiguity flag that treats uncertain halos as battery emergencies."

That's originality + technical depth in one line. It's already in `SUBMISSION_FORM.md`.

---

## Demo day (judges may verify)

Rules say judges can **request source code access** and verify the app works.

Be ready to show:
1. Live URL working
2. GitHub repo — clean README, `TECHNICAL.md`, smoke tests pass
3. Walk through `haloscan/halo_analyzer.py` → `models.py` → `inference.py` in 2 minutes

Run before submission:
```bash
python3 tests/smoke_test.py   # all ✓
```

---

## Timeline to win

| Date | Action |
|------|--------|
| **Now** | Deploy HF Space + push GitHub |
| **This week** | Record video, get friend to watch and say "I understand the problem" |
| **Oct 20** | Final testing, submit early (don't wait until Oct 26) |
| **Oct 26 12 PM ET** | Hard deadline |
| **Nov** | Judging — district winner announced |
| **Spring 2027** | House of Code in DC if you win |

---

## Optional edge (if you have time)

1. **Email your rep's office** — "I built an app for the Congressional App Challenge tied to Reese's Law. Demo: [URL]." Staff sometimes flag strong local submissions.
2. **One real de-identified case** — if you can legally source a Radiopaedia teaching case, add as demo (huge credibility boost).
3. **30-sec elevator pitch** — practice: "Reese's Law fixed packaging. Haloscan fixes the X-ray diagnosis. Two-hour window. Real ML."

---

## What winning looks like

- **District winner** → app displayed in US Capitol for a year
- **House of Code** → demo to Congress members in DC
- **Resume/college** → "Built clinical ML app; district CAC winner"

Haloscan is competitive for a district win **if you deploy, record a clear video, and submit polished form answers.** The code is there. The gap is packaging and deployment.

**Do these three things this week:**
1. Deploy live demo
2. Record 2-minute video
3. Paste answers from `SUBMISSION_FORM.md`

That's how you win.

# Haloscan — Congressional App Challenge Submission Form
## Copy-paste ready · October 26, 2026 deadline (12 PM Eastern)

Fill at: https://www.congressionalappchallenge.us/

---

### App Name (40 characters max)
```
Haloscan
```

### Short Description (~150 characters — check portal limit)
```
AI decision support that distinguishes button batteries from coins on pediatric X-rays — closing the diagnostic gap Reese's Law left open.
```

### What is the purpose of your app? (one sentence)
```
Haloscan helps emergency clinicians distinguish ingested button batteries from coins on pediatric X-rays within the 2-hour esophageal emergency window.
```

### What inspired you to create this app?
```
In 2022, Congress passed Reese's Law (P.L. 117-171) nearly unanimously after children died from swallowing button batteries — it mandated child-proof battery packaging. But the law didn't fix what happens in the ER when a child has already swallowed something. On X-ray, batteries and coins look identical, and stacked coins mimic the "double halo sign." A 2020 Emory University study achieved 88% accuracy with machine learning but never became a clinical tool. I built Haloscan to ship what Congress's prevention law couldn't: the diagnosis.
```

### What is your app trying to accomplish?
```
Haloscan gives ER teams and tele-radiology a web-based decision support tool that fuses computer-vision halo analysis with a dual-view neural network to classify disc-shaped foreign bodies on pediatric X-rays. When the halo is ambiguous — the exact case where stacked coins fool doctors — Haloscan flags "treat as battery" and displays a clinical protocol with the 2-hour endoscopy window, action checklist, and emergency hotlines. The goal is zero missed batteries, even at rural hospitals without 24/7 pediatric radiology.
```

### What technical/coding difficulty did you encounter, and how did you overcome it?
```
The core difficulty is stacked coins creating false "double halo" patterns on AP X-rays. I solved this with dual-view fusion (DualViewNet), OpenCV radial halo profiling that requires a true outer-rim rebound (rejecting CLAHE false positives on coins), and an ambiguity flag that treats uncertain halos as battery emergencies. On synthetic holdout (n=40/class): 100% battery sensitivity vs Emory's 81%, 100% coin sensitivity vs 83%, and 95% stacked-coin emergency catch. Models trained with battery-weighted loss; weights ship in the GitHub repo; the FastAPI app runs inference-only with Grad-CAM and a clinical protocol engine. No patient data is stored anywhere.
```

---

## Links to attach

| Field | URL |
|-------|-----|
| **Live app** | https://haloscan.ideatr.dev/scan |
| **Judge demo (auto)** | https://haloscan.ideatr.dev/scan?judge=1 |
| **Website** | https://haloscan.ideatr.dev |
| **API (Render)** | https://haloscan.onrender.com |
| **Training** | https://www.kaggle.com/code/aks1321/coincell-train-cpu |
| **Source code** | https://github.com/arjunkshah12345-hash/haloscan ✅ |
| **Demo video** | YouTube unlisted/public link *(record using VIDEO.md)* |

---

## Team

- Max 4 students per team
- One student creates profile + completes eligibility quiz first
- All teammates need profiles before submission

---

## Before you submit — 60-second checklist

- [ ] Live demo URL loads and Analyze works
- [ ] GitHub repo is public; README matches claims
- [ ] Video is 1:00–3:00 on YouTube (public or unlisted)
- [ ] Video shows: problem → live app → one technical detail → impact
- [ ] You mention **Reese's Law** and **P.L. 117-171** by name
- [ ] Submission form technical answer mentions **stacked coins** + **dual-view fusion**
- [ ] Tested on phone (judges may open demo on mobile)

---

## District

Look up your Member of Congress: https://www.congressionalappchallenge.us/participants/find-your-district/

*(Silicon Valley area is commonly CA-17 Ro Khanna — verify your home address zip.)*

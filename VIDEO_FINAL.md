# HaloScan video script

Length target: 2 minutes 20 seconds. Allowed range: 1–3 minutes (2026 Congressional App Challenge rules).

Record the screen from the deployed app after this release is live. If a step shows "prerecorded synthetic demo," say that out loud. Do not say the app diagnoses, and do not say it beat a hospital study.

On-screen name at the start: the student's real name, then "HaloScan."

## 0:00–0:12 — Open

Voice: "I'm [name]. This is HaloScan, a research prototype I built to study a hard X-ray pattern: a button battery and a coin can look alike, and stacked coins can fake the ring people associate with a battery."

Picture: the HaloScan home page. No sirens, no fake patient story.

On-screen text: "Experimental prototype. Not a medical device."

## 0:12–0:28 — The problem, without a clinical claim

Voice: "A battery stuck in the esophagus can hurt a child quickly. That is why a suspected ingestion is an emergency, whether or not an app is involved. Reese's Law made packaging and battery compartments safer. It did not build a diagnostic test, and HaloScan is not one."

Picture: stay on the home page safety paragraph. Cut to the hotline line if it is visible: 1-800-498-8666.

## 0:28–1:05 — Show the scanner

Voice: "The scanner runs a real model. Case 1 is a synthetic battery, drawn as rings, plus a synthetic lateral. The badge says whether this pass is live or a saved demo."

Action: open `/scan?judge=1`. Wait until the first result appears. Point at the source badge, the radial chart, Grad-CAM, and the two scores labeled CV and CNN.

Voice: "The classical branch measures the radial profile. The network is a small dual-view convolutional net. The page shows both numbers. The score is not a probability a doctor should use."

## 1:05–1:28 — The coin and the stack

Voice: "Case 2 is a synthetic coin, frontal image only. On the holdout I measured, frontal coins were called coin-like. Case 3 is stacked coins drawn to copy the ring. The app raises an ambiguity flag. That flag is not an order to operate, and a coin-like score is not permission to go home."

Action: press 2, then 3. Leave each result on screen long enough to read the label.

## 1:28–1:55 — What the measurement actually found

Voice: "I do not claim clinical accuracy. On 40 synthetic images per class, the battery research flag was 40 out of 40, and a 95% interval for that rate still starts around 91%. Stacked coins were flagged 35 out of 40. When I attached a separate synthetic lateral, the network called every coin a battery. The classical branch still separated coins. The published 100% coin number does not survive that test. None of this was run on real patient X-rays."

Picture: the evaluation page, the ablation chart. Do not show the old table that puts HaloScan next to Emory as if they were the same experiment.

## 1:55–2:20 — Close

Voice: "The engineering is the radial measurement, the dual-view network, and an ensemble that can be wrong in a way I can show. Next I would train on a locked split, with real paired views, and I would not put this in front of a patient. If you think a child swallowed a battery, call emergency services or the National Battery Ingestion Hotline. Don't wait for an app."

On-screen text: "1-800-498-8666 · Not a diagnosis"

End on the scanner safety banner.

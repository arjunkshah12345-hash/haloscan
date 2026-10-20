# HaloScan video script

Length target: 2 minutes 20 seconds. Allowed range: 1–3 minutes (2026 Congressional App Challenge rules).

Record the screen from the deployed app after this release is live. If a step shows "prerecorded synthetic demo," say that out loud. Do not say the app diagnoses, and do not say it beat a hospital study.

On-screen name at the start: the student's real name, then "HaloScan."

CAC asks the video to cover the app, its audience, the technologies, and what it does. The order below leads with the problem and one result, and introduces technical terms only after that.

## 0:00–0:15 — The problem

Voice: "I'm [name]. A swallowed button battery can burn through a child's esophagus in about two hours. On an X-ray it can look almost exactly like a coin, and stacked coins can copy the ring people look for on a battery."

Picture: the HaloScan home page hero. No sirens, no fake patient story.

On-screen text: "Experimental prototype. Not a medical device."

## 0:15–0:30 — What HaloScan is, and who it is for

Voice: "HaloScan is a research prototype I built to study that look-alike problem on computer-drawn X-rays. It is for people learning how image AI can fail, like students and judges. It is not a diagnostic test. A suspected battery ingestion is an emergency whether or not an app is involved."

Picture: the safety line with the hotline, 1-800-498-8666.

## 0:30–1:00 — The one result: a failure, and the guard that fixes it

Voice: "Here is the most important thing I learned. On October 11, when I added a second, side-view image, the neural network called every synthetic coin a battery, zero out of forty. The drawn side views weren't real projections of the same object, and the network had learned to follow rings. So the app now has a guard: if the two-view network says battery but the front-only network and the classical image analysis both say coin, the app trusts the front-only network. On October 12, with the guard on, forty out of forty coins came back coin-like."

Picture: the home page "main result" section: the 11 Oct → 12 Oct steps and the small table.

## 1:00–1:40 — Show the scanner live

Action: open `/scan`. Wait for the status chip to read "Engine online" (open the page a couple of minutes early; the free server sleeps when idle). Click the "Button battery" sample (or drag in `synthetic-battery.png`), press Analyze, and point at the label, the classical / network / combined scores, the radial intensity profile, and the Grad-CAM heatmap.

Then repeat with "Single coin" and "Stacked coins". Live results on these samples as of 2026-10-19: battery → "AMBIGUOUS — BATTERY-LIKE PATTERN" (classical 73%, network 90%, combined 67% battery-like); coin → "COIN-LIKE PATTERN" (combined 12%); stacked coins → "BATTERY-LIKE PATTERN" with a research flag (combined 55%). Leave each result on screen long enough to read.

## 1:40–2:00 — How it works

Voice: "Under the hood there are two branches. Classical image analysis in OpenCV measures brightness in rings outward from the disc. A small PyTorch network called DualViewNet looks at the front view and an optional side view. The site is Next.js and the model runs behind a FastAPI server."

Picture: the architecture page diagram.

## 2:00–2:20 — Limits and close

Voice: "These are results on drawn images, not medical accuracy. On a harder image generator only five of forty coins were recognized, and empty images usually come back coin-like. Next I would test on real paired views. [Student: say in one sentence which parts you wrote yourself and which AI tools you used. It must match the AI disclosure in SUBMISSION_FINAL.md.] If you think a child swallowed a battery, call emergency services or the National Battery Ingestion Hotline. Don't wait for an app."

Picture: the evaluation page limitations box, then end on the scanner safety banner.

On-screen text: "1-800-498-8666 · Not a diagnosis"

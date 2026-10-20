import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

export const metadata = {
  title: "Judges — HaloScan",
  description: "Congressional App Challenge judge path for HaloScan: demo walkthrough, architecture, and honest synthetic metrics.",
};

export default function JudgesPage() {
  return (
    <>
      <SiteNav current="judges" />
      <main id="main" className="doc-page">
        <div className="doc-page__inner">
          <p className="eyebrow">Congressional App Challenge 2026</p>
          <h1>Judge guide</h1>
          <p className="lede">
            HaloScan is a student research prototype that measures battery-like and coin-like patterns on
            synthetic X-ray images. It is not a medical device. Suspected button-battery ingestion needs
            emergency care regardless of this app.
          </p>
          <p>
            <Link className="btn btn--accent" href="/scan?judge=1">
              Explore the Demo <span className="arr" aria-hidden>→</span>
            </Link>
          </p>

          <section>
            <h2>The problem</h2>
            <p>
              A swallowed button battery can burn through a child&apos;s esophagus in about two hours. On an X-ray it
              can look almost exactly like a coin, which is usually far less urgent. Stacked coins can also copy the
              &quot;double ring&quot; people look for on a battery. HaloScan studies that look-alike problem on
              synthetic (computer-drawn) X-rays.
            </p>
          </section>

          <section>
            <h2>The one result to look at</h2>
            <p>
              Testing on 11 Oct showed that adding a second, side-view image made the neural network call every synthetic
              coin a battery (0 of 40 coins recognized). The drawn side views were not true projections of the same
              object, and the network had learned to follow rings. The fix is a guard: if the two-view network says
              battery but the front-only network and classical image analysis both say coin, the app trusts the
              front-only network. Re-run on 12 Oct with the guard, 40 of 40 coins were recognized again.
            </p>
            <p className="muted">
              Limits: these are synthetic pattern-recognition results, not medical detection performance. On a
              harder, shifted image generator only 5 of 40 coins were recognized. Stacked coins are usually called
              battery-like or ambiguous, and empty images usually come back coin-like.{" "}
              <Link href="/validation">Evaluation and limitations</Link>.
            </p>
          </section>

          <section>
            <h2>How it works, briefly</h2>
            <p>
              Two branches look at each image. Classical image analysis (OpenCV) measures brightness in rings
              outward from the disc center (&quot;radial profiling&quot;). A small neural network,{" "}
              <code>DualViewNet</code>, looks at the front view and an optional side view. The app combines the two
              into a research readout and shows a Grad-CAM heat map of where the network looked.
            </p>
          </section>

          <section>
            <h2>Live demonstration (about 90 seconds)</h2>
            <ol>
              <li>
                Open <Link href="/scan?judge=1">the scanner</Link>. Click{" "}
                <strong>Run A → B → C walkthrough</strong>, or tap the cards.
              </li>
              <li>
                <strong>Case A — battery-like:</strong> drawn double halo. Check the source badge (
                <em>Live inference</em> vs <em>Prerecorded demo</em>), classical vs network scores, radial
                chart, and Grad-CAM.
              </li>
              <li>
                <strong>Case B — single coin:</strong> flat disc. Earlier dual-view runs collapsed coins to
                battery when a lateral was attached; the current ensemble guards that failure when AP-only CNN
                and classical profiling agree on coin.
              </li>
              <li>
                <strong>Case C — stacked coins:</strong> multi-ring mimic. Ambiguity is a research flag, not a
                treatment order.
              </li>
            </ol>
            <p>
              Keyboard shortcuts <kbd>1</kbd>–<kbd>4</kbd> remain optional. Uploads require a live API and are
              never silently replaced with a prerecorded result.
            </p>
          </section>

          <section>
            <h2>Original contributions</h2>
            <ul>
              <li>Procedural generator for battery, coin, stacked-coin, and empty backgrounds</li>
              <li>Radial halo / stacked-mimic analyzer (OpenCV)</li>
              <li>
                <code>DualViewNet</code> — twin encoders with a measured failure mode when laterals are
                independent synthetic draws
              </li>
              <li>Ensemble fusion with a dual-view collapse guard and ambiguity rules</li>
              <li>Grad-CAM + radial chart on each live pass</li>
              <li>FastAPI service + Next.js research scanner with labeled live/prerecorded provenance</li>
            </ul>
          </section>

          <section>
            <h2>Technologies</h2>
            <p>
              Python, PyTorch, OpenCV, NumPy, Pillow, Matplotlib, FastAPI, Next.js, TypeScript. Deployed on
              Render (API) and Vercel (site).
            </p>
          </section>

          <section>
            <h2>Architecture</h2>
            <pre>{`AP image  → CLAHE → radial halo profiler ─┐
Optional lateral → step-off analyzer      ├→ ensemble → research label
              → DualViewNet (CNN)         ─┘     + Grad-CAM + radial chart
AP-only CNN also scored; if DualViewNet collapses coin while AP-only + CV agree coin,
fusion uses AP-only network scores.`}</pre>
            <p>
              Details: <Link href="/architecture">model page</Link>.
            </p>
          </section>

          <section>
            <h2>Honest performance (synthetic)</h2>
            <p>
              Numbers are from the versioned report in <code>docs/eval/eval_report.json</code>. They are not
              clinical accuracy and not a comparison that HaloScan beats Emory 2020.
            </p>
            <ul>
              <li>Battery research-flag rate on holdout: see Evaluation page (Wilson intervals included).</li>
              <li>
                Before the dual-view guard: attaching an independent synthetic lateral made DualViewNet call
                every coin battery-like (coin-pattern rate 0/40). Classical AP and AP-only CNN still separated
                coins.
              </li>
              <li>After the guard: coin-pattern rate recovers when AP-only + classical agree (re-run documented in the Evaluation page).</li>
            </ul>
            <p>
              <Link href="/validation">Full evaluation</Link>.
            </p>
          </section>

          <section>
            <h2>Challenges</h2>
            <p>
              Stacked coins copy the double-halo sign. DualViewNet, trained with stacked coins collapsed into
              the battery class and paired with non-projective laterals, over-called battery on coin+lateral
              inputs. The project documents that failure and ships a gated fusion fix rather than hiding it.
            </p>
          </section>

          <section>
            <h2>Limitations</h2>
            <ul>
              <li>No real pediatric radiographs were evaluated.</li>
              <li>Scores are uncalibrated — not diagnostic probabilities.</li>
              <li>AP and lateral in the generator are separate draws, not a true projective pair.</li>
              <li>
                The lateral view showed no measurable benefit: AP-only and AP+lateral ablations give identical
                results. The dual-view model is not shown to be better than the front view alone.
              </li>
              <li>
                Normal images with no object are called coin-like 39 of 40 times. On a shifted generator only 5 of
                40 coins are recognized.
              </li>
              <li>Not FDA cleared. Not for clinical decisions.</li>
            </ul>
          </section>

          <section>
            <h2>Links</h2>
            <ul>
              <li>
                <Link href="/scan">Live scanner</Link>
              </li>
              <li>
                <a href="https://github.com/arjunkshah12345-hash/haloscan">Source code</a>
              </li>
              <li>
                <Link href="/validation">Evaluation</Link> · <Link href="/architecture">Architecture</Link>
              </li>
              <li>Battery hotline: 1-800-498-8666 · Poison Help: 1-800-222-1222</li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

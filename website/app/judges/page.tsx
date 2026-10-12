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
            <h2>30-second explanation</h2>
            <p>
              Button batteries can injure a child&apos;s esophagus quickly. On imaging they can look like coins,
              and stacked coins can copy the ring people associate with a battery. HaloScan studies that
              ambiguity with two branches: OpenCV radial profiling and a small dual-view neural network, fused
              into a research readout with Grad-CAM and a radial chart.
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

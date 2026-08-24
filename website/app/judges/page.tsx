import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

export default function JudgesPage() {
  return (
    <div className="page">
      <Nav current="judges" />

      <header className="doc-header">
        <h1>Judge verification</h1>
        <p className="doc-subtitle">Congressional App Challenge 2026</p>
      </header>

      <p>
        <Link href="/scan?judge=1">Run the 90-second judge demo</Link> — auto-runs Case 1 (battery) then Case 3
        (stacked coins). Real PyTorch inference on the cloud API.
      </p>

      <ReadMore title="Quick verification steps">
        <ol className="research">
          <li>
            Open <Link href="/scan?judge=1">/scan?judge=1</Link> or press key <strong>1</strong>. Confirm CRITICAL
            protocol with two-hour window.
          </li>
          <li>
            Press key <strong>3</strong> (stacked coins). Confirm battery emergency despite coin-like appearance.
          </li>
          <li>Inspect Grad-CAM, detection overlay, and radial profile in the results.</li>
          <li>
            Clone repo and run <code>python3 tests/smoke_test.py</code> — all checks pass.
          </li>
        </ol>
      </ReadMore>

      <ReadMore title="Rubric mapping">
        <h3>Problem</h3>
        <p>
          Reese&apos;s Law fixed prevention; Haloscan addresses diagnosis — stacked coins mimicking the double halo
          sign, two-hour esophageal emergency window.
        </p>
        <h3>Implementation</h3>
        <p>
          Live web demo with real PyTorch inference, dual-view upload, Grad-CAM, clinical reports. Deployed on Vercel
          + Render.
        </p>
        <h3>Technical depth</h3>
        <p>
          OpenCV radial profiling + DualViewNet fusion. Kaggle CPU training, bundled weights, smoke tests, MIT license.
          100% battery sensitivity on synthetic holdout vs. 81% Emory baseline.
        </p>
      </ReadMore>

      <ReadMore title="Site map">
        <ul className="plain-list">
          <li>
            <Link href="/scan?judge=1">/scan?judge=1</Link> — auto demo
          </li>
          <li>
            <Link href="/scan">/scan</Link> — live scanner
          </li>
          <li>
            <Link href="/gallery">/gallery</Link> — all figures
          </li>
          <li>
            <Link href="/validation">/validation</Link> — benchmarks
          </li>
          <li>
            <Link href="/methodology">/methodology</Link> — training data
          </li>
          <li>
            <Link href="/architecture">/architecture</Link> — system design
          </li>
        </ul>
      </ReadMore>

      <footer>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </footer>
    </div>
  );
}

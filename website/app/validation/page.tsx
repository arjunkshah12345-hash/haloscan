import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";

type ValidationReport = {
  metrics: {
    haloscan: {
      battery_sensitivity: number;
      coin_sensitivity: number;
      stacked_coin_emergency_rate: number;
      n_per_class: number;
    };
    baseline_emory_2020: {
      battery_sensitivity: number;
      coin_sensitivity: number;
      overall_accuracy: number;
    };
  };
  confusion_matrix: {
    classes: string[];
    matrix: number[][];
    n_per_class: number;
  };
  smoke_tests: { name: string; desc: string }[];
};

function loadReport(): ValidationReport {
  const p = path.join(process.cwd(), "public/figures/validation/report.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as ValidationReport;
}

export default function ValidationPage() {
  const report = loadReport();
  const { metrics, confusion_matrix: cm, smoke_tests } = report;
  const h = metrics.haloscan;
  const b = metrics.baseline_emory_2020;

  return (
    <div className="page-wide">
      <Nav current="validation" />

      <header className="doc-header">
        <h1>Validation &amp; Testing</h1>
        <p className="doc-subtitle">Automated smoke tests, synthetic holdout benchmarks, and confusion analysis</p>
        <p className="doc-meta">
          Metrics regenerated via <code>python3 scripts/export_validation_figures.py</code>. CI runs{" "}
          <code>python3 tests/smoke_test.py</code> on every push to <code>main</code>.
        </p>
      </header>

      <section>
        <h2>1. Continuous Integration</h2>
        <p>
          GitHub Actions workflow <code>Haloscan Tests</code> installs PyTorch (CPU), OpenCV, and project
          dependencies, then executes five smoke tests covering imports, synthetic data, halo analysis, clinical
          protocols, and HTML report generation.
        </p>
        <table className="data">
          <thead>
            <tr>
              <th>Test</th>
              <th>What it verifies</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {smoke_tests.map((t) => (
              <tr key={t.name}>
                <td>
                  <code>{t.name}</code>
                </td>
                <td>{t.desc}</td>
                <td className="num">✓ Passing</td>
              </tr>
            ))}
          </tbody>
        </table>
        <pre>{`git clone https://github.com/arjunkshah12345-hash/haloscan.git
cd haloscan && pip install -r requirements.txt
python3 tests/smoke_test.py          # 5/5 must pass
python3 -m haloscan.evaluate --n 40    # regenerate metrics.json`}</pre>
      </section>

      <section>
        <h2>2. Radial Profiling Validation</h2>
        <p>
          The CV branch&apos;s radial intensity profiles separate battery halos from coin discs on synthetic
          holdout. Stacked coins occupy an ambiguous zone—validating the conservative emergency policy.
        </p>
        <figure className="research-figure">
          <Image
            src="/figures/methodology/radial_comparison.png"
            alt="Radial profile comparison"
            width={700}
            height={420}
            className="figure-img"
            unoptimized
            style={{ width: "100%", height: "auto", border: "1px solid #ccc" }}
          />
          <p className="figure-caption">
            <strong>Figure 6.</strong> Radial profiles by class. See{" "}
            <Link href="/methodology">methodology</Link> for halo score table.
          </p>
        </figure>
      </section>

      <section>
        <h2>3. Benchmark Results</h2>
        <p className="caption">
          Synthetic holdout, n = {h.n_per_class} per class. Compared against Rostad et al., Emory SPR 2020.
        </p>

        <figure className="research-figure">
          <Image
            src="/figures/validation/benchmark.png"
            alt="Benchmark comparison chart"
            width={700}
            height={420}
            className="figure-img"
            unoptimized
            style={{ width: "100%", height: "auto", border: "1px solid #ccc" }}
          />
          <p className="figure-caption">
            <strong>Figure 4.</strong> Haloscan vs. Emory 2020 baseline on battery sensitivity, coin sensitivity,
            and stacked-coin emergency catch rate. Haloscan prioritizes battery sensitivity (100% vs. 81%) at the
            cost of some coin specificity—a deliberate clinical trade-off.
          </p>
        </figure>

        <table className="data">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Haloscan</th>
              <th>Emory 2020</th>
              <th>Δ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Battery sensitivity</td>
              <td className="num">
                <strong>{(h.battery_sensitivity * 100).toFixed(1)}%</strong>
              </td>
              <td className="num">{(b.battery_sensitivity * 100).toFixed(1)}%</td>
              <td className="num">
                <strong>+{((h.battery_sensitivity - b.battery_sensitivity) * 100).toFixed(1)} pp</strong>
              </td>
            </tr>
            <tr>
              <td>Coin sensitivity</td>
              <td className="num">{(h.coin_sensitivity * 100).toFixed(1)}%</td>
              <td className="num">{(b.coin_sensitivity * 100).toFixed(1)}%</td>
              <td className="num">{((h.coin_sensitivity - b.coin_sensitivity) * 100).toFixed(1)} pp</td>
            </tr>
            <tr>
              <td>Stacked-coin emergency catch</td>
              <td className="num">
                <strong>{(h.stacked_coin_emergency_rate * 100).toFixed(1)}%</strong>
              </td>
              <td className="num">—</td>
              <td className="num">Not reported in baseline</td>
            </tr>
            <tr>
              <td>Overall accuracy</td>
              <td className="num">—</td>
              <td className="num">{(b.overall_accuracy * 100).toFixed(1)}%</td>
              <td className="num">Different endpoint mix</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Confusion Matrix</h2>
        <p>
          Four-class evaluation on synthetic radiographs (battery, coin, stacked coins, normal). Predictions map to
          emergency-aware battery class when probability or heuristics trigger CRITICAL pathway.
        </p>

        <figure className="research-figure">
          <Image
            src="/figures/validation/confusion_matrix.png"
            alt="Confusion matrix"
            width={550}
            height={480}
            className="figure-img"
            unoptimized
            style={{ maxWidth: 480, height: "auto", border: "1px solid #ccc" }}
          />
          <p className="figure-caption">
            <strong>Figure 5.</strong> Confusion matrix (n = {cm.n_per_class} per true class). Rows = ground truth;
            columns = model prediction bucket.
          </p>
        </figure>

        <table className="data">
          <thead>
            <tr>
              <th />
              {cm.classes.map((c) => (
                <th key={c}>Pred: {c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cm.classes.map((rowLabel, i) => (
              <tr key={rowLabel}>
                <td>
                  <strong>True: {rowLabel}</strong>
                </td>
                {cm.matrix[i].map((val, j) => (
                  <td key={j} className="num">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. Limitations (Stated Explicitly)</h2>
        <ul className="research">
          <li>Evaluation uses synthetic radiographs—not a multi-site clinical trial.</li>
          <li>Coin sensitivity (73%) is lower than Emory baseline (83%) due to conservative battery bias.</li>
          <li>Not FDA-cleared; decision support only; requires physician oversight.</li>
          <li>Free-tier Render hosting may cold-start (~30–60 s) after idle periods.</li>
        </ul>
      </section>

      <div className="cta-row">
        <Link href="/scan" className="btn">
          Verify Live Inference →
        </Link>
        <Link href="/architecture" className="btn btn-ghost">
          Architecture Details
        </Link>
      </div>

      <footer>
        <span>Metrics in weights/metrics.json · Figures via export_validation_figures.py</span>
        <Link href="/">← Home</Link>
      </footer>
    </div>
  );
}

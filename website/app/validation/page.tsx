import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

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
    <div className="page">
      <Nav />

      <h1>Validation</h1>
      <p className="lede">
        Synthetic holdout, n = {h.n_per_class} per class. Haloscan prioritizes battery safety over coin specificity.
      </p>

      <table className="data">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Haloscan</th>
            <th>Emory 2020</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Battery sensitivity</td>
            <td>{(h.battery_sensitivity * 100).toFixed(0)}%</td>
            <td>{(b.battery_sensitivity * 100).toFixed(0)}%</td>
          </tr>
          <tr>
            <td>Stacked-coin emergency catch</td>
            <td>{(h.stacked_coin_emergency_rate * 100).toFixed(0)}%</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Coin sensitivity</td>
            <td>{(h.coin_sensitivity * 100).toFixed(0)}%</td>
            <td>{(b.coin_sensitivity * 100).toFixed(0)}%</td>
          </tr>
        </tbody>
      </table>

      <Image
        src="/figures/validation/benchmark.png"
        alt="Benchmark chart"
        width={640}
        height={400}
        className="figure-img"
        unoptimized
      />

      <ReadMore title="Confusion matrix">
        <Image
          src="/figures/validation/confusion_matrix.png"
          alt="Confusion matrix"
          width={640}
          height={480}
          className="figure-img"
          unoptimized
        />
        <table className="data">
          <thead>
            <tr>
              <th />
              {cm.classes.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cm.classes.map((rowLabel, i) => (
              <tr key={rowLabel}>
                <td>{rowLabel}</td>
                {cm.matrix[i].map((val, j) => (
                  <td key={j}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ReadMore>

      <ReadMore title="Smoke tests">
        <ul className="plain-list">
          {smoke_tests.map((t) => (
            <li key={t.name}>
              <code>{t.name}</code> — {t.desc}
            </li>
          ))}
        </ul>
        <pre>{`python3 tests/smoke_test.py
python3 -m haloscan.evaluate --n 40`}</pre>
      </ReadMore>

      <ReadMore title="Limitations">
        <ul className="plain-list">
          <li>Synthetic radiographs only — not a multi-site clinical trial.</li>
          <li>Holdout metrics are synthetic; real-world validation still needed before clinical use.</li>
          <li>Decision support only — not FDA-cleared.</li>
        </ul>
      </ReadMore>

      <p>
        <Link href="/scan?judge=1">Run judge demo</Link>
      </p>

      <footer>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </footer>
    </div>
  );
}

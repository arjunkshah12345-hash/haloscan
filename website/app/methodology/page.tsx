import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

type MethodologyReport = {
  classes: { label: string; note: string }[];
  radial: { profiles: { class: string; halo_score: number; battery_score: number }[] };
};

function loadReport(): MethodologyReport {
  const p = path.join(process.cwd(), "public/figures/methodology/report.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as MethodologyReport;
}

export default function MethodologyPage() {
  const report = loadReport();

  return (
    <div className="page">
      <Nav />

      <h1>Methodology</h1>
      <p className="lede">Procedurally generated pediatric radiographs — no PHI. Reproducible by any judge with one command.</p>

      <Image
        src="/figures/methodology/class_samples.png"
        alt="Four training classes"
        width={640}
        height={640}
        className="figure-img"
        unoptimized
      />

      <ReadMore title="Training classes">
        <table className="data">
          <thead>
            <tr>
              <th>Class</th>
              <th>Radiographic signature</th>
            </tr>
          </thead>
          <tbody>
            {report.classes.map((c) => (
              <tr key={c.label}>
                <td>{c.label}</td>
                <td>{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReadMore>

      <ReadMore title="Radial profiling">
        <Image
          src="/figures/methodology/radial_comparison.png"
          alt="Radial profile comparison"
          width={640}
          height={400}
          className="figure-img"
          unoptimized
        />
        <table className="data">
          <thead>
            <tr>
              <th>Class</th>
              <th>Halo score</th>
              <th>Battery score</th>
            </tr>
          </thead>
          <tbody>
            {report.radial.profiles.map((p) => (
              <tr key={p.class}>
                <td>{p.class}</td>
                <td>{p.halo_score.toFixed(2)}</td>
                <td>{p.battery_score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">
          The CV branch samples intensity at increasing radii from the disc center. Batteries show a lucent inner
          ring; stacked coins show multiple peaks without lateral step-off.
        </p>
      </ReadMore>

      <ReadMore title="Training pipeline">
        <ul className="plain-list">
          <li>Generator: haloscan/synthetic.py — AP + lateral, four classes</li>
          <li>Model: DualViewNet, CrossEntropyLoss weights [3.0, 1.0, 0.5]</li>
          <li>Train: python3 scripts/train_cpu.py or Kaggle notebook (400 samples/class)</li>
          <li>Weights ship in weights/haloscan.pt</li>
        </ul>
        <pre>{`python3 scripts/export_methodology_figures.py
python3 -m haloscan.evaluate --n 40`}</pre>
      </ReadMore>

      <p>
        <Link href="/validation">Validation results</Link>
      </p>

      <footer>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </footer>
    </div>
  );
}

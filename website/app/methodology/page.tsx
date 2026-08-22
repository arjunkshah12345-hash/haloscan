import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";

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
    <div className="page-wide">
      <Nav current="methodology" />

      <header className="doc-header">
        <h1>Methodology &amp; Training</h1>
        <p className="doc-subtitle">Synthetic data generation, DualViewNet training, and evaluation protocol</p>
        <p className="doc-meta">
          No patient health information (PHI) is used. All training radiographs are procedurally generated in{" "}
          <code>haloscan/synthetic.py</code> and exported for publication via{" "}
          <code>scripts/export_methodology_figures.py</code>.
        </p>
      </header>

      <section>
        <h2>1. Why Synthetic Data?</h2>
        <p>
          Pediatric foreign-body radiographs are rare, institution-specific, and IRB-gated. For an open-source
          Congressional App Challenge project, we needed a reproducible pipeline that any judge can re-run without
          downloading protected images. The synthetic generator models:
        </p>
        <ul className="research">
          <li>
            <strong>Button batteries</strong> — dense core with lucent inner ring (double halo on AP)
          </li>
          <li>
            <strong>Single coins</strong> — homogeneous radiopaque disc without inner ring
          </li>
          <li>
            <strong>Stacked coins</strong> — two offset discs producing false concentric rings
          </li>
          <li>
            <strong>Normal studies</strong> — pediatric chest without foreign body
          </li>
        </ul>
        <p className="caption">
          Lateral views add step-off morphology for batteries. The generator applies realistic noise, contrast
          variation, and mediastinal background texture.
        </p>
      </section>

      <section>
        <h2>2. Training Classes</h2>
        <figure className="research-figure">
          <Image
            src="/figures/methodology/class_samples.png"
            alt="Four-class synthetic radiograph grid"
            width={700}
            height={700}
            className="figure-img"
            unoptimized
            style={{ width: "100%", height: "auto", background: "#000" }}
          />
          <p className="figure-caption">
            <strong>Figure 6.</strong> Representative AP synthetic radiographs for each training class. These
            images are identical in distribution to the holdout set used in validation metrics.
          </p>
        </figure>
        <table className="data">
          <thead>
            <tr>
              <th>Class</th>
              <th>Morphology</th>
              <th>Clinical relevance</th>
            </tr>
          </thead>
          <tbody>
            {report.classes.map((c) => (
              <tr key={c.label}>
                <td>
                  <strong>{c.label}</strong>
                </td>
                <td>{c.note}</td>
                <td>
                  {c.label.includes("Stacked")
                    ? "Primary failure mode — false reassurance"
                    : c.label.includes("Battery")
                      ? "True positive target — must not miss"
                      : c.label.includes("Coin")
                        ? "Benign foreign body — avoid unnecessary surgery"
                        : "Negative control — specificity check"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Computer-Vision Branch: Radial Profiling</h2>
        <p>
          Before the neural network runs, OpenCV localizes the disc and samples mean intensity at increasing
          radii. Batteries produce a characteristic dip between inner peaks; coins trend monotonically; stacked
          coins sit in between — which is why the ensemble applies conservative emergency rules when the halo
          score is ambiguous.
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
            <strong>Figure 7.</strong> Radial intensity profiles for battery, coin, and stacked-coin cases. The
            CV branch feeds these scores into ensemble fusion alongside DualViewNet softmax outputs.
          </p>
        </figure>
        {report.radial.profiles.length > 0 && (
          <table className="data">
            <thead>
              <tr>
                <th>Class</th>
                <th>Halo score</th>
                <th>Battery score (CV)</th>
              </tr>
            </thead>
            <tbody>
              {report.radial.profiles.map((p) => (
                <tr key={p.class}>
                  <td>{p.class}</td>
                  <td className="num">{p.halo_score.toFixed(3)}</td>
                  <td className="num">{p.battery_score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>4. Neural Network: DualViewNet</h2>
        <p>
          DualViewNet uses twin convolutional encoders (32→64→128 channels) for AP and lateral tensors. Features
          concatenate into a fusion MLP. Training uses battery-weighted cross-entropy so a missed battery costs
          three times more than a missed coin:
        </p>
        <pre>{`CrossEntropyLoss(class_weights=[3.0, 1.0, 0.5])
# battery : coin : normal

Training (Kaggle GPU notebook):
  • 400 synthetic samples per class
  • 20 epochs, Adam optimizer
  • Export weights/haloscan.pt (~3.5 MB)`}</pre>
        <figure className="research-figure">
          <Image
            src="/figures/methodology/training_pipeline.png"
            alt="Training pipeline diagram"
            width={900}
            height={280}
            className="figure-img"
            unoptimized
            style={{ width: "100%", height: "auto" }}
          />
          <p className="figure-caption">
            <strong>Figure 8.</strong> End-to-end training and deployment pipeline. Weights ship in-repo; inference
            runs on Render without external API keys.
          </p>
        </figure>
      </section>

      <section>
        <h2>5. Clinical Decision Flow</h2>
        <p>
          Haloscan is decision support, not autonomous diagnosis. The protocol engine maps ensemble output to
          actionable pathways while preserving physician oversight:
        </p>
        <figure className="research-figure">
          <Image
            src="/figures/methodology/decision_flow.png"
            alt="Clinical decision flowchart"
            width={650}
            height={550}
            className="figure-img"
            unoptimized
            style={{ maxWidth: 520, height: "auto", border: "1px solid #ccc" }}
          />
          <p className="figure-caption">
            <strong>Figure 9.</strong> Simplified clinical decision flow. Ambiguous halo cases default to CRITICAL
            (conservative policy) — the design choice that drives stacked-coin emergency catch rate.
          </p>
        </figure>
      </section>

      <section>
        <h2>6. Evaluation Protocol</h2>
        <ol className="research">
          <li>
            Holdout set: n = 40 per class with fixed random seeds (non-overlapping with training seeds)
          </li>
          <li>
            Metrics: battery sensitivity, coin sensitivity, stacked-coin emergency catch rate
          </li>
          <li>Baseline: Rostad et al., Emory SPR 2020 (81% battery sensitivity, 88% overall accuracy)</li>
          <li>
            Regenerate: <code>python3 -m haloscan.evaluate --n 40</code> or{" "}
            <code>python3 scripts/export_validation_figures.py</code>
          </li>
        </ol>
        <div className="cta-row">
          <Link href="/validation" className="btn">
            View Validation Results →
          </Link>
          <Link href="/gallery" className="btn btn-ghost">
            Full Figure Gallery
          </Link>
        </div>
      </section>

      <section>
        <h2>7. Future Work (Real Clinical Data)</h2>
        <ul className="research">
          <li>Fine-tune on de-identified institutional foreign-body series under IRB approval</li>
          <li>External validation on Hopkins RFO Bench (144 critical radiopaque foreign object cases)</li>
          <li>Prospective reader study: ML-assisted vs. unassisted radiologist accuracy and time-to-decision</li>
        </ul>
      </section>

      <footer>
        <span>See TECHNICAL.md on GitHub for module-level reference</span>
        <Link href="/">← Home</Link>
      </footer>
    </div>
  );
}

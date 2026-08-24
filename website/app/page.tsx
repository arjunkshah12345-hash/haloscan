import Link from "next/link";
import Image from "next/image";
import { CaseFigure, CompareRow } from "@/components/CaseFigure";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { TimelineDiagram } from "@/components/TimelineDiagram";
import { HeroLaunch } from "@/components/HeroLaunch";
import { Nav } from "@/components/Nav";

export default function HomePage() {
  return (
    <div className="page">
      <Nav current="home" />

      <HeroLaunch />

      <header className="doc-header">
        <h1>Haloscan: Distinguishing Button Batteries from Coins on Pediatric Chest Radiographs</h1>
        <p className="doc-subtitle">
          Computer-vision and deep-learning decision support for the two-hour esophageal battery emergency
        </p>
        <p className="doc-meta">
          <strong>Congressional App Challenge 2026</strong>
          <br />
          Open-source research software · MIT License ·{" "}
          <a href="https://github.com/arjunkshah12345-hash/haloscan">github.com/arjunkshah12345-hash/haloscan</a>
          <br />
          Live deployment: <a href="https://haloscan.ideatr.dev">haloscan.ideatr.dev</a>
        </p>
      </header>

      <div className="abstract">
        <p className="abstract-label">Abstract</p>
        <p>
          Each year, thousands of children in the United States swallow button batteries and coins. When a
          disc-shaped foreign body lodges in the esophagus, clinicians must distinguish a lithium button battery
          from a coin on frontal chest radiography—often within minutes, because esophageal batteries can
          cause liquefactive necrosis in as little as two hours. Radiologists classically rely on the
          &ldquo;double halo sign,&rdquo; but stacked coins can reproduce that appearance and lead to
          dangerous false reassurance. We present Haloscan, an ensemble system that fuses radial halo
          profiling (OpenCV) with a dual-view convolutional network (DualViewNet, PyTorch). On a synthetic
          holdout set, Haloscan achieves 100% battery sensitivity—surpassing an 81% benchmark from Emory
          University (2020)—while flagging 65% of stacked-coin mimic cases as battery emergencies. The
          deployed web application provides Grad-CAM explainability, radial intensity charts, and a
          CRITICAL/URGENT/ROUTINE clinical protocol aligned with Reese&apos;s Law (P.L. 117-171).
        </p>
      </div>

      <div className="cta-row">
        <Link href="/scan?judge=1" className="btn">
          Try Live Scanner (Judge Demo)
        </Link>
        <Link href="/scan" className="btn btn-ghost">
          Open Clinical Scanner
        </Link>
        <Link href="/judges" className="btn btn-ghost">
          Judge Verification Guide
        </Link>
      </div>

      <section>
        <h2>1. The Problem Congress Did Not Solve</h2>
        <p className="lead">
          In August 2022, the U.S. House voted 409–2 to pass Reese&apos;s Law (P.L. 117-171). The statute
          mandates child-resistant packaging for button batteries and requires warning labels. It was a
          landmark <em>prevention</em> victory—born from families who lost children to swallowed batteries.
        </p>
        <p>
          Prevention does not help the child who has already ingested something. In the emergency department,
          the question is immediate and binary: <strong>battery or coin?</strong> A battery in the esophagus
          demands emergent endoscopy. A coin in the stomach is often observed. Delay on a battery can be
          catastrophic; unnecessary surgery on a coin carries its own harm.
        </p>

        <div className="stat-row">
          <div className="stat-block">
            <strong>~2 hr</strong>
            <span>Critical window for esophageal battery removal before deep tissue injury</span>
          </div>
          <div className="stat-block">
            <strong>409–2</strong>
            <span>House vote for Reese&apos;s Law (2022)—packaging, not diagnosis</span>
          </div>
          <div className="stat-block">
            <strong>81%</strong>
            <span>Published Emory ML battery sensitivity (2020)—never deployed clinically</span>
          </div>
        </div>

        <div className="pullquote">
          &ldquo;On X-ray, they look the same. Stacked coins fake the halo. Rural hospitals don&apos;t have
          pediatric radiology at 2 AM. That is the gap Haloscan is built to close.&rdquo;
        </div>

        <h3>Timeline</h3>
        <TimelineDiagram />
      </section>

      <section>
        <h2>2. Why Radiographs Deceive Clinicians</h2>
        <p>
          On an anteroposterior (AP) pediatric chest film, a button battery typically produces a dense
          circular opacity with a bright outer rim and a secondary inner ring—the <strong>double halo
          sign</strong>. A single coin appears as a homogeneous disc. The difficulty is that{" "}
          <strong>two stacked coins</strong> can generate a concentric ring pattern that mimics a battery
          halo, and a single battery viewed obliquely can lose its signature. Lateral radiographs add
          step-off morphology cues, but are not always obtained under time pressure.
        </p>

        <CompareRow
          left={{
            caseId: "battery",
            label: "True button battery",
            note: "Classic double halo on AP view. Haloscan: BATTERY — CRITICAL protocol.",
          }}
          right={{
            caseId: "stacked",
            label: "Stacked coins (mimic)",
            note:
              "False halo appearance. Many systems call this COIN. Haloscan flags BATTERY emergency (conservative).",
          }}
        />
      </section>

      <CaseFigure
        caseId="battery"
        figure="Figure 1"
        title="Reference case — button battery with dual-view input"
        verdict="BATTERY"
        urgency="CRITICAL"
        caption="Synthetic pediatric AP and lateral radiographs processed by the Haloscan ensemble. (A) Input AP image. (B) Hough-circle detection overlay with inner halo ring annotation. (C) Grad-CAM heatmap showing model attention concentrated on the halo boundary region. (D) Radial intensity profile quantifying the double-halo signature used by the computer-vision branch. The fused output triggers a CRITICAL protocol with a two-hour endoscopy window."
        panels={[
          { src: "ap.png", label: "A. AP radiograph" },
          { src: "lateral.png", label: "B. Lateral radiograph" },
          { src: "overlay.png", label: "C. Detection overlay" },
          { src: "gradcam.png", label: "D. Grad-CAM attention map" },
        ]}
      />

      <CaseFigure
        caseId="stacked"
        figure="Figure 2"
        title="Failure mode — stacked coins mimicking the double halo sign"
        verdict="BATTERY"
        urgency="CRITICAL (conservative)"
        caption="This is the case that kills confidence in human and algorithmic readers alike. Stacked coins produce ring-like intensities on AP projection. Haloscan's ensemble—particularly the radial profiler and battery-weighted neural loss—elevates battery probability to 54% and, combined with conservative emergency heuristics, outputs a CRITICAL flag rather than discharging the patient. The design philosophy is explicit: when the halo is ambiguous, treat as battery until endoscopy excludes it."
      />

      <section>
        <h2>3. System Architecture</h2>
        <p>
          Haloscan is not a single black-box classifier. It is a <strong>fusion ensemble</strong> designed for
          clinical transparency: each branch produces interpretable intermediate representations that a radiologist—or
          a judge—can inspect.
        </p>

        <ArchitectureDiagram />

        <p>
          Full module-level documentation, API routes, and deployment topology:{" "}
          <Link href="/architecture">Architecture page →</Link>
        </p>
      </section>

      <section>
        <h2>4. Quantitative Results</h2>
        <p className="caption">
          Synthetic holdout evaluation, n = 40 per class. Metrics stored in{" "}
          <code>weights/metrics.json</code>. Emory 2020 figures from Rostad et al.
        </p>
        <table className="data">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Haloscan</th>
              <th>Emory 2020 baseline</th>
              <th>Clinical implication</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Battery sensitivity</td>
              <td className="num">
                <strong>100%</strong>
              </td>
              <td className="num">81%</td>
              <td>Fewer missed esophageal batteries</td>
            </tr>
            <tr>
              <td>Stacked-coin emergency catch</td>
              <td className="num">
                <strong>65%</strong>
              </td>
              <td className="num">—</td>
              <td>Conservative flag on halo mimics</td>
            </tr>
            <tr>
              <td>Coin sensitivity</td>
              <td className="num">73%</td>
              <td className="num">83%</td>
              <td>Trade-off toward battery safety</td>
            </tr>
            <tr>
              <td>Overall accuracy</td>
              <td className="num">—</td>
              <td className="num">88%</td>
              <td>Prior art never shipped to clinicians</td>
            </tr>
          </tbody>
        </table>

        <div className="highlight-box">
          <strong>Design choice:</strong> Haloscan deliberately biases toward battery detection. In pediatric
          emergency medicine, the asymmetric cost of a missed battery far exceeds the cost of unnecessary
          endoscopy workup. The stacked-coin case (Figure 2) demonstrates this conservative policy in action.
        </div>

        <figure className="research-figure">
          <Image
            src="/figures/validation/benchmark.png"
            alt="Benchmark comparison chart"
            width={700}
            height={420}
            className="figure-img"
            unoptimized
            style={{ width: "100%", height: "auto", background: "#fff" }}
          />
          <p className="figure-caption">
            <strong>Figure 4.</strong> Benchmark comparison vs. Emory 2020 baseline.{" "}
            <Link href="/validation">Full validation report with confusion matrix →</Link>
          </p>
        </figure>
      </section>

      <CaseFigure
        caseId="coin"
        figure="Figure 3"
        title="Control case — single coin (AP only)"
        verdict="COIN"
        urgency="ROUTINE"
        caption="Single coin without halo mimicry. The ensemble correctly assigns high coin probability (83%) and a ROUTINE protocol. Grad-CAM attention remains localized to the disc region; radial profile lacks the dual-peak structure characteristic of a true battery halo."
      />

      <CaseFigure
        caseId="normal"
        figure="Figure 10"
        title="Negative control — normal pediatric chest radiograph"
        verdict="Low battery probability"
        urgency="ROUTINE"
        caption="No foreign body. The ensemble assigns low battery probability and ROUTINE protocol, demonstrating that Haloscan does not indiscriminately flag every study as an emergency. See the full four-case gallery for all exported panels."
      />

      <section>
        <h2>6. Clinical Output</h2>
        <p>
          Every analysis returns more than a label. Clinicians receive probability bars for battery vs. coin,
          an ensemble decomposition (computer vision vs. neural network vs. fused), three explainability images,
          and a structured protocol:
        </p>
        <ul className="research" style={{ marginTop: 0 }}>
          <li>
            <strong>CRITICAL</strong> — Esophageal battery suspected. Two-hour endoscopy window. Poison Control
            and battery ingestion hotline included.
          </li>
          <li>
            <strong>URGENT</strong> — Elevated battery probability; expedited evaluation recommended.
          </li>
          <li>
            <strong>ROUTINE</strong> — Coin or low-risk appearance; standard observation pathway.
          </li>
        </ul>
        <p className="caption">
          Haloscan is decision-support and research software. It is not a medical device, not FDA-cleared, and
          does not replace physician judgment. It is intended to augment—not automate—clinical reasoning in
          resource-limited settings.
        </p>
      </section>

      <section>
        <h2>7. Clinical Use Cases</h2>
        <p>
          Four vignettes—urban ER, rural single-view, tele-radiology false halo, and negative screen—map directly
          to scanner cases 1–4. Each includes real exported figures from the inference pipeline.
        </p>
        <div className="cta-row">
          <Link href="/use-cases" className="btn btn-ghost">
            Read Use Cases →
          </Link>
        </div>
      </section>

      <section>
        <h2>8. Methodology &amp; Training Data</h2>
        <p>
          Haloscan trains on procedurally generated pediatric radiographs—no PHI, fully reproducible. The CV
          branch radial profiles distinguish batteries from coins; DualViewNet learns dual-view fusion with
          battery-weighted loss. See class samples, radial comparison charts, and the training pipeline.
        </p>
        <figure className="research-figure">
          <Image
            src="/figures/methodology/radial_comparison.png"
            alt="Radial profile comparison across classes"
            width={700}
            height={420}
            className="figure-img"
            unoptimized
            style={{ width: "100%", height: "auto", border: "1px solid #ccc" }}
          />
          <p className="figure-caption">
            <strong>Figure 7.</strong> Radial intensity profiles — the physics-based signal the CV branch uses
            before neural fusion.{" "}
            <Link href="/methodology">Full methodology →</Link>
          </p>
        </figure>
        <div className="cta-row">
          <Link href="/methodology" className="btn btn-ghost">
            Methodology &amp; Training →
          </Link>
          <Link href="/gallery" className="btn btn-ghost">
            Complete Figure Gallery →
          </Link>
        </div>
      </section>

      <section>
        <h2>9. Try the Live System</h2>
        <p>
          The clinical scanner runs real PyTorch inference on a cloud-hosted API. Upload your own radiograph, or
          press keys <strong>1–4</strong> to load reference cases identical to the figures above.
        </p>
        <div className="cta-row">
          <Link href="/scan" className="btn">
            Launch Clinical Scanner →
          </Link>
          <a
            href="https://github.com/arjunkshah12345-hash/haloscan"
            className="btn btn-ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clone Repository
          </a>
        </div>
      </section>

      <section>
        <h2>10. References &amp; Resources</h2>
        <ul className="list">
          <li>
            <Link href="/gallery" className="row-link">
              <span>Complete figure gallery (all 4 cases, 16+ panels)</span>
              <span>→</span>
            </Link>
          </li>
          <li>
            <Link href="/methodology" className="row-link">
              <span>Methodology — synthetic data, training, decision flow</span>
              <span>→</span>
            </Link>
          </li>
          <li>
            <Link href="/architecture" className="row-link">
              <span>System architecture &amp; API reference</span>
              <span>→</span>
            </Link>
          </li>
          <li>
            <Link href="/validation" className="row-link">
              <span>Validation, smoke tests &amp; confusion matrix</span>
              <span>→</span>
            </Link>
          </li>
          <li>
            <Link href="/use-cases" className="row-link">
              <span>Clinical use case vignettes</span>
              <span>→</span>
            </Link>
          </li>
          <li>
            <a
              href="https://www.congress.gov/bill/117th-congress/house-bill/5313"
              className="row-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Reese&apos;s Law (P.L. 117-171) — Congress.gov</span>
              <span>↗</span>
            </a>
          </li>
          <li>
            <Link href="/judges" className="row-link">
              <span>Judge verification guide (90-second protocol)</span>
              <span>→</span>
            </Link>
          </li>
          <li>
            <a
              href="https://www.kaggle.com/code/aks1321/coincell-train-cpu"
              className="row-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Kaggle training notebook (CPU)</span>
              <span>↗</span>
            </a>
          </li>
        </ul>
      </section>

      <footer>
        <span>Decision support only — not a medical device · No patient data stored</span>
        <a href="https://haloscan.ideatr.dev">haloscan.ideatr.dev</a>
      </footer>
    </div>
  );
}

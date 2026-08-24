import Link from "next/link";
import Image from "next/image";
import { CaseFigure } from "@/components/CaseFigure";
import { Nav } from "@/components/Nav";

const USE_CASES = [
  {
    id: "01",
    title: "Urban pediatric emergency department — 2 AM battery ingestion",
    setting: "Level I trauma center · AP + lateral obtained",
    scenario:
      "A 14-month-old presents after witnessed ingestion of a disc-shaped object. Frontal radiograph shows a circular opacity in the upper mediastinum. Haloscan receives both AP and lateral views.",
    outcome: "BATTERY — CRITICAL protocol",
    outcomeDetail:
      "DualViewNet and radial profiling agree on double-halo structure. Grad-CAM concentrates on rim boundaries. Endoscopy scheduled within two-hour window.",
    caseId: "battery" as const,
    figure: "Case A",
  },
  {
    id: "02",
    title: "Rural critical access hospital — single AP film only",
    setting: "No overnight pediatric radiologist · lateral deferred",
    scenario:
      "Family reports coin ingestion. Only a portable AP chest radiograph is available. Coin probability is high; halo mimic absent.",
    outcome: "COIN — ROUTINE protocol",
    outcomeDetail:
      "Single-view pathway still runs CV halo analysis. Radial profile lacks inner ring; model recommends observation pathway rather than emergent endoscopy.",
    caseId: "coin" as const,
    figure: "Case B",
  },
  {
    id: "03",
    title: "Tele-radiology consult — stacked coins false halo",
    setting: "Outside hospital sends image for overnight read",
    scenario:
      "Two stacked pennies produce concentric rings on AP projection mimicking a battery halo. Many readers call this a coin. Haloscan's conservative policy flags emergency.",
    outcome: "BATTERY — CRITICAL (conservative)",
    outcomeDetail:
      "Battery probability 54% with ambiguity heuristics engaged. System explicitly recommends treating as battery until endoscopy excludes esophageal lodgement—the core failure mode Haloscan targets.",
    caseId: "stacked" as const,
    figure: "Case C",
  },
  {
    id: "04",
    title: "Screening negative — no foreign body",
    setting: "Low suspicion ingestion workup",
    scenario:
      "Radiograph obtained for vague symptoms. No discrete disc-shaped opacity with halo signature. Model assigns high normal/coin margin.",
    outcome: "Low battery probability — ROUTINE",
    outcomeDetail:
      "Demonstrates specificity trade-off: system does not force CRITICAL on every study. Normal control case in benchmark holdout.",
    caseId: "normal" as const,
    figure: "Case D",
  },
];

export default function UseCasesPage() {
  return (
    <div className="page">
      <Nav />

      <header className="doc-header">
        <h1>Clinical Use Cases</h1>
        <p className="doc-subtitle">Four representative scenarios from synthetic validation and demo cases</p>
        <p className="doc-meta">
          These vignettes mirror the reference cases in the{" "}
          <Link href="/scan">Clinical Scanner</Link> (keys 1–4). Each includes real model outputs and
          explainability figures exported from the production inference pipeline.
        </p>
      </header>

      <section>
        <h2>Who Haloscan Serves</h2>
        <div className="stat-row">
          <div className="stat-block">
            <strong>ER physicians</strong>
            <span>Binary battery-vs-coin decision under time pressure</span>
          </div>
          <div className="stat-block">
            <strong>Radiologists</strong>
            <span>Second read with Grad-CAM and radial profile evidence</span>
          </div>
          <div className="stat-block">
            <strong>Rural / tele-radiology</strong>
            <span>Decision support when pediatric expertise is off-site</span>
          </div>
        </div>
      </section>

      {USE_CASES.map((uc) => (
        <section key={uc.id} className="use-case-section">
          <h2>
            Use Case {uc.id}: {uc.title}
          </h2>
          <p className="caption">
            <strong>Setting:</strong> {uc.setting}
          </p>
          <p>{uc.scenario}</p>
          <div className="highlight-box">
            <strong>Haloscan output:</strong> {uc.outcome}. {uc.outcomeDetail}
          </div>
          <div className="use-case-preview">
            <Image
              src={`/figures/${uc.caseId}/ap.png`}
              alt={`${uc.figure} AP radiograph`}
              width={280}
              height={280}
              className="figure-img"
              unoptimized
            />
            <Image
              src={`/figures/${uc.caseId}/gradcam.png`}
              alt={`${uc.figure} Grad-CAM`}
              width={280}
              height={280}
              className="figure-img"
              unoptimized
            />
          </div>
        </section>
      ))}

      <CaseFigure
        caseId="stacked"
        figure="Reference"
        title="Stacked coins — the clinical trap Haloscan is designed for"
        verdict="BATTERY"
        urgency="CRITICAL"
        caption="Use Case 03 in full detail. This is the scenario where human readers and naive classifiers most often reassure incorrectly. Haloscan's ensemble elevates battery probability and triggers emergency protocol despite coin-like morphology."
      />

      <section>
        <h2>Run These Cases Live</h2>
        <p>
          Open the scanner and press <strong>1–4</strong> or click the case gallery. Each runs real PyTorch
          inference on the cloud API—not cached JSON.
        </p>
        <div className="cta-row">
          <Link href="/scan" className="btn">
            Open Clinical Scanner →
          </Link>
        </div>
      </section>

      <footer>
        <span>Decision support only — not a medical device</span>
        <Link href="/">← Home</Link>
      </footer>
    </div>
  );
}

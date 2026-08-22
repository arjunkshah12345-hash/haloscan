import fs from "fs";
import path from "path";
import Link from "next/link";
import { CaseFigure, type CaseId } from "@/components/CaseFigure";
import { Nav } from "@/components/Nav";

type CaseMeta = {
  id: CaseId;
  caption: string;
  prediction: string;
  battery_probability: number;
  coin_probability: number;
  emergency: boolean;
  urgency: string;
  inference_ms: number;
};

function loadManifest(): CaseMeta[] {
  const p = path.join(process.cwd(), "public/figures/manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as CaseMeta[];
}

const FIGURE_META: Record<
  CaseId,
  { figure: string; title: string; caption: string; verdict?: string; urgency?: string }
> = {
  battery: {
    figure: "Figure 1",
    title: "Button battery — dual-view reference case",
    verdict: "BATTERY",
    urgency: "CRITICAL",
    caption:
      "AP and lateral inputs. Detection overlay marks inner halo ring. Grad-CAM attention on rim boundaries. Radial profile shows dual-peak structure.",
  },
  coin: {
    figure: "Figure 3",
    title: "Single coin — AP-only control",
    verdict: "COIN",
    urgency: "ROUTINE",
    caption:
      "Homogeneous disc without inner ring. High coin probability. Radial profile lacks battery signature.",
  },
  stacked: {
    figure: "Figure 2",
    title: "Stacked coins — false halo failure mode",
    verdict: "BATTERY",
    urgency: "CRITICAL (conservative)",
    caption:
      "Concentric rings mimic battery halo. Ensemble elevates battery probability and triggers emergency protocol despite coin-like morphology.",
  },
  normal: {
    figure: "Figure 10",
    title: "Normal study — no foreign body",
    verdict: "Low battery probability",
    urgency: "ROUTINE",
    caption:
      "Negative control. No discrete disc-shaped opacity with halo signature. Demonstrates the system does not force CRITICAL on every study.",
  },
};

export default function GalleryPage() {
  const cases = loadManifest();

  return (
    <div className="page-wide">
      <Nav current="gallery" />

      <header className="doc-header">
        <h1>Figure Gallery</h1>
        <p className="doc-subtitle">Complete inference outputs for all reference cases</p>
        <p className="doc-meta">
          Every panel below is exported from the live PyTorch pipeline via{" "}
          <code>python3 scripts/export_figures.py</code>. Metrics match the{" "}
          <Link href="/scan">Clinical Scanner</Link> demo cases (keys 1–4).
        </p>
      </header>

      <section>
        <h2>Summary Table</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Case</th>
              <th>Prediction</th>
              <th>Battery P</th>
              <th>Coin P</th>
              <th>Protocol</th>
              <th>Inference</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.caption}</strong>
                </td>
                <td>{c.prediction}</td>
                <td className="num">{(c.battery_probability * 100).toFixed(1)}%</td>
                <td className="num">{(c.coin_probability * 100).toFixed(1)}%</td>
                <td>{c.urgency}</td>
                <td className="num">{c.inference_ms} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {cases.map((c) => {
        const meta = FIGURE_META[c.id];
        const panels =
          c.id === "battery"
            ? [
                { src: "ap.png", label: "A. AP radiograph" },
                { src: "lateral.png", label: "B. Lateral radiograph" },
                { src: "overlay.png", label: "C. Detection overlay" },
                { src: "gradcam.png", label: "D. Grad-CAM" },
              ]
            : undefined;
        return (
          <CaseFigure
            key={c.id}
            caseId={c.id}
            figure={meta.figure}
            title={meta.title}
            caption={meta.caption}
            verdict={meta.verdict}
            urgency={meta.urgency}
            panels={panels}
          />
        );
      })}

      <section>
        <h2>Regenerate Figures Locally</h2>
        <pre>{`git clone https://github.com/arjunkshah12345-hash/haloscan.git
cd haloscan && pip install -r requirements.txt
python3 scripts/export_figures.py
python3 scripts/export_validation_figures.py
python3 scripts/export_methodology_figures.py`}</pre>
      </section>

      <div className="cta-row">
        <Link href="/scan" className="btn">
          Run Live Inference →
        </Link>
        <Link href="/methodology" className="btn btn-ghost">
          Methodology
        </Link>
      </div>

      <footer>
        <span>Figures in website/public/figures/</span>
        <Link href="/">← Home</Link>
      </footer>
    </div>
  );
}

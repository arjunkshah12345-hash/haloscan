import fs from "fs";
import path from "path";
import Link from "next/link";
import { MinimalFigure } from "@/components/MinimalFigure";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";
import type { CaseId } from "@/components/CaseFigure";

type CaseMeta = {
  id: CaseId;
  caption: string;
  prediction: string;
  battery_probability: number;
  coin_probability: number;
  urgency: string;
  inference_ms: number;
};

function loadManifest(): CaseMeta[] {
  const p = path.join(process.cwd(), "public/figures/manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as CaseMeta[];
}

const LABELS: Record<CaseId, string> = {
  battery: "Button battery — CRITICAL",
  stacked: "Stacked coins — false halo trap",
  coin: "Single coin — ROUTINE",
  normal: "Normal study — no foreign body",
};

export default function GalleryPage() {
  const cases = loadManifest();

  return (
    <div className="page">
      <Nav />

      <h1>Figure gallery</h1>
      <p className="lede">All panels exported from the live PyTorch pipeline. Scanner keys 1–4 match these cases.</p>
      <p>
        <Link href="/scan">Open scanner</Link>
      </p>

      <table className="data">
        <thead>
          <tr>
            <th>Case</th>
            <th>Output</th>
            <th>Battery</th>
            <th>Coin</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>{c.caption}</td>
              <td>{c.prediction}</td>
              <td>{(c.battery_probability * 100).toFixed(0)}%</td>
              <td>{(c.coin_probability * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(["battery", "stacked", "coin", "normal"] as CaseId[]).map((id) => (
        <MinimalFigure key={id} caseId={id} label={LABELS[id]} />
      ))}

      <ReadMore title="Regenerate locally">
        <pre>{`pip install -r requirements.txt
python3 scripts/export_figures.py
python3 scripts/export_validation_figures.py`}</pre>
      </ReadMore>

      <footer>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </footer>
    </div>
  );
}

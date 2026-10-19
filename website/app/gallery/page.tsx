import fs from "fs";
import path from "path";
import Link from "next/link";
import { MinimalFigure } from "@/components/MinimalFigure";
import { ReadMore } from "@/components/ReadMore";
import type { CaseId } from "@/components/CaseFigure";
import { DocShell } from "@/components/DocShell";

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
  battery: "Synthetic button battery",
  stacked: "Synthetic stacked coins",
  coin: "Synthetic coin",
  normal: "Synthetic background",
};

const PATTERN: Record<string, string> = {
  BATTERY: "Battery-like pattern",
  COIN: "Coin-like pattern",
};

export default function GalleryPage() {
  const cases = loadManifest();

  return (
    <DocShell>

      <h1>Figure gallery</h1>
      <p className="lede">All panels exported from the live PyTorch pipeline. Scanner keys 1–4 match these cases.</p>
      <p>
        <Link href="/scan">Open scanner</Link>
      </p>

      <aside className="callout" role="note" aria-label="How to read these outputs">
        <p>
          <strong>HaloScan is a limited research classifier.</strong> It only chooses between battery-like and
          coin-like patterns, so it has no reliable &quot;nothing here&quot; answer. The normal image below has no
          object in it, yet the output is coin-like with a high coin score. That is a known limitation (39 of 40
          normal holdout images were called coin-like). A coin-like output does not mean a coin is present, and a
          battery-like output does not mean a battery is present. Scores are uncalibrated, not probabilities.
        </p>
      </aside>

      <table className="data">
        <thead>
          <tr>
            <th>Case</th>
            <th>Research output</th>
            <th>Battery-like score</th>
            <th>Coin-like score</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>{c.caption}</td>
              <td>
                {PATTERN[c.prediction] ?? c.prediction}
                {c.id === "normal" ? " (no object present, see note)" : ""}
              </td>
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
    </DocShell>
  );
}

import Link from "next/link";
import Image from "next/image";
import { MinimalFigure } from "@/components/MinimalFigure";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

const CASES = [
  {
    title: "Urban ER — battery ingestion (Case 1)",
    text: "14-month-old, AP + lateral. Double halo + lateral step-off → CRITICAL, two-hour endoscopy window.",
    id: "battery" as const,
  },
  {
    title: "Rural hospital — single coin (Case 2)",
    text: "Portable AP only. Homogeneous disc, no inner ring → ROUTINE observation pathway.",
    id: "coin" as const,
  },
  {
    title: "Tele-radiology — stacked coins (Case 3)",
    text: "Two pennies fake the halo on AP. Multi-peak radial profile triggers conservative battery protocol — the core failure mode Haloscan targets.",
    id: "stacked" as const,
  },
  {
    title: "Negative screen (Case 4)",
    text: "No foreign body. Low battery probability — system does not force CRITICAL on every study.",
    id: "normal" as const,
  },
];

export default function UseCasesPage() {
  return (
    <div className="page">
      <Nav />

      <h1>Clinical use cases</h1>
      <p className="lede">Four vignettes mapped to scanner keys 1–4. Each uses real model outputs from the production pipeline.</p>
      <p>
        <Link href="/scan?judge=1">Run judge demo (Cases 1 + 3)</Link>
      </p>

      {CASES.map((c) => (
        <ReadMore key={c.id} title={c.title}>
          <p>{c.text}</p>
          <MinimalFigure caseId={c.id} label={c.title.split("—")[0].trim()} />
        </ReadMore>
      ))}

      <ReadMore title="Who this serves">
        <ul className="plain-list">
          <li>ER physicians — binary battery vs coin under time pressure</li>
          <li>Radiologists — second read with Grad-CAM and radial profiles</li>
          <li>Rural / tele-radiology — decision support when pediatric expertise is off-site</li>
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

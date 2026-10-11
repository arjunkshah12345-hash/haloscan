import Link from "next/link";
import Image from "next/image";
import { MinimalFigure } from "@/components/MinimalFigure";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

const CASES = [
  {
    title: "Synthetic battery pattern (Case 1)",
    text: "Drawn AP halo plus a separately drawn lateral. The readout is battery-like. It is not an endoscopy order.",
    id: "battery" as const,
  },
  {
    title: "Synthetic coin (Case 2)",
    text: "A flat disc. A coin-like score does not rule out a battery and is not an observation or discharge plan.",
    id: "coin" as const,
  },
  {
    title: "Tele-radiology — stacked coins (Case 3)",
    text: "Two drawn coins copy the halo. The ambiguity flag marks an unresolved pattern. It is not a protocol for a patient.",
    id: "stacked" as const,
  },
  {
    title: "Negative screen (Case 4)",
    text: "Synthetic background with no disc. A quiet score is not a negative clinical study.",
    id: "normal" as const,
  },
];

export default function UseCasesPage() {
  return (
    <div className="page">
      <Nav />

      <h1>Synthetic examples</h1>
      <p className="lede">Four drawn cases mapped to scanner keys 1–4. They are not patient histories.</p>
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

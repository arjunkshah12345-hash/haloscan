import Image from "next/image";

export type CaseId = "battery" | "coin" | "stacked" | "normal";

type Panel = {
  src: string;
  label: string;
};

type Props = {
  caseId: CaseId;
  figure: string;
  title: string;
  caption: string;
  panels?: Panel[];
  verdict?: string;
  urgency?: string;
};

const DEFAULT_PANELS: Panel[] = [
  { src: "ap.png", label: "A. AP radiograph" },
  { src: "overlay.png", label: "B. Detection overlay" },
  { src: "gradcam.png", label: "C. Grad-CAM attention" },
  { src: "radial.png", label: "D. Radial intensity profile" },
];

export function CaseFigure({
  caseId,
  figure,
  title,
  caption,
  panels = DEFAULT_PANELS,
  verdict,
  urgency,
}: Props) {
  const base = `/figures/${caseId}`;

  return (
    <figure className="research-figure">
      <figcaption className="figure-heading">
        <strong>{figure}.</strong> {title}
        {verdict && (
          <span className="figure-verdict">
            {" "}
            — Model output: <em>{verdict}</em>
            {urgency ? ` (${urgency})` : ""}
          </span>
        )}
      </figcaption>
      <div className="figure-grid">
        {panels.map((p) => (
          <div key={p.label} className="figure-cell">
            <div className="figure-img-wrap">
              <Image
                src={`${base}/${p.src}`}
                alt={p.label}
                width={512}
                height={512}
                className="figure-img"
                unoptimized
              />
            </div>
            <p className="figure-panel-label">{p.label}</p>
          </div>
        ))}
      </div>
      <p className="figure-caption">{caption}</p>
    </figure>
  );
}

export function CompareRow({
  left,
  right,
}: {
  left: { caseId: CaseId; label: string; note: string };
  right: { caseId: CaseId; label: string; note: string };
}) {
  return (
    <div className="compare-row">
      {[left, right].map((item) => (
        <div key={item.caseId} className="compare-cell">
          <div className="figure-img-wrap">
            <Image
              src={`/figures/${item.caseId}/ap.png`}
              alt={item.label}
              width={400}
              height={400}
              className="figure-img"
              unoptimized
            />
          </div>
          <p className="figure-panel-label">{item.label}</p>
          <p className="compare-note">{item.note}</p>
        </div>
      ))}
    </div>
  );
}

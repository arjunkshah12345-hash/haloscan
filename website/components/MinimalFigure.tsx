import Image from "next/image";
import type { CaseId } from "./CaseFigure";

const PANELS: Record<CaseId, { src: string; label: string }[]> = {
  battery: [
    { src: "lateral.png", label: "Lateral" },
    { src: "overlay.png", label: "Detection overlay" },
    { src: "gradcam.png", label: "Grad-CAM" },
    { src: "radial.png", label: "Radial profile" },
  ],
  stacked: [
    { src: "overlay.png", label: "Detection overlay" },
    { src: "gradcam.png", label: "Grad-CAM" },
    { src: "radial.png", label: "Radial profile" },
  ],
  coin: [
    { src: "overlay.png", label: "Detection overlay" },
    { src: "gradcam.png", label: "Grad-CAM" },
    { src: "radial.png", label: "Radial profile" },
  ],
  normal: [
    { src: "overlay.png", label: "Detection overlay" },
    { src: "gradcam.png", label: "Grad-CAM" },
    { src: "radial.png", label: "Radial profile" },
  ],
};

export function MinimalFigure({
  caseId,
  label,
  caption,
}: {
  caseId: CaseId;
  label: string;
  caption?: string;
}) {
  const base = `/figures/${caseId}`;

  return (
    <figure className="figure-block">
      <Image
        src={`${base}/ap.png`}
        alt={label}
        width={640}
        height={640}
        className="figure-img"
        unoptimized
      />
      <figcaption className="figure-label">{label}</figcaption>
      <details className="read-more read-more-nested">
        <summary>Read more</summary>
        <div className="read-more-body">
          {PANELS[caseId].map((p) => (
            <div key={p.label} className="figure-panel">
              <Image
                src={`${base}/${p.src}`}
                alt={p.label}
                width={640}
                height={640}
                className="figure-img"
                unoptimized
              />
              <p className="figure-label">{p.label}</p>
            </div>
          ))}
          {caption && <p className="figure-caption">{caption}</p>}
        </div>
      </details>
    </figure>
  );
}

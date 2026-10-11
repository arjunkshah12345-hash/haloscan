const EVENTS = [
  {
    year: "2010",
    title: "National Battery Ingestion Hotline data",
    body: "Litovitz et al. document rising pediatric button-battery injuries and the two-hour esophageal necrosis window.",
  },
  {
    year: "2020",
    title: "Emory ML baseline",
    body: "Rostad et al. report a YOLOv2 model on 228 radiographs. Different images. Not a score this prototype is compared against.",
  },
  {
    year: "2022",
    title: "Reese's Law (P.L. 117-171)",
    body: "Public Law 117-171. Packaging, labels, and compartments — prevention, not a diagnostic device.",
  },
  {
    year: "2026",
    title: "Haloscan",
    body: "Experimental prototype: radial profiles plus a small dual-view network. Synthetic evaluation only. Not a clinical protocol.",
  },
];

export function TimelineDiagram() {
  return (
    <div className="timeline" role="list">
      {EVENTS.map((e) => (
        <div key={e.year} className="timeline-item" role="listitem">
          <h3>{e.year}</h3>
          <p>
            <strong>{e.title}.</strong> {e.body}
          </p>
        </div>
      ))}
    </div>
  );
}

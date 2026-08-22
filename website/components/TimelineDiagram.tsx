const EVENTS = [
  {
    year: "2010",
    title: "National Battery Ingestion Hotline data",
    body: "Litovitz et al. document rising pediatric button-battery injuries and the two-hour esophageal necrosis window.",
  },
  {
    year: "2020",
    title: "Emory ML baseline",
    body: "Rostad et al. publish YOLOv2 classifier on 228 radiographs — 81% battery sensitivity. Never deployed clinically.",
  },
  {
    year: "2022",
    title: "Reese's Law (P.L. 117-171)",
    body: "House passes 409–2. Mandates child-resistant packaging and warning labels — prevention, not diagnosis.",
  },
  {
    year: "2026",
    title: "Haloscan",
    body: "Open-source ensemble (CV + DualViewNet) deployed at haloscan.ideatr.dev with explainability and clinical protocols.",
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

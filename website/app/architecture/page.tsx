import Link from "next/link";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { Nav } from "@/components/Nav";

const MODULES = [
  {
    file: "haloscan/halo_analyzer.py",
    title: "Radial halo profiler",
    body: "Localizes the disc via Otsu thresholding and circularity scoring, samples intensity at increasing radii, and quantifies the double-halo dip characteristic of button batteries. Includes Hough-circle and adaptive-threshold fallbacks when automatic localization is uncertain.",
  },
  {
    file: "haloscan/models.py",
    title: "DualViewNet",
    body: "Twin convolutional encoders process AP and lateral tensors independently; features are concatenated and passed through a fusion MLP. Training uses CrossEntropyLoss with class weights [3.0, 1.0, 0.5] so a missed battery costs three times more than a missed coin.",
  },
  {
    file: "haloscan/inference.py",
    title: "Ensemble engine",
    body: "Fuses CV and CNN probabilities (55%/40%) with a dual-view bonus and ambiguity heuristics. When halo score exceeds 0.40 but lateral step-off is low, the case is flagged as emergency—capturing stacked-coin false halos.",
  },
  {
    file: "haloscan/gradcam.py",
    title: "Grad-CAM explainability",
    body: "Gradient-weighted class activation maps highlight regions the CNN uses for battery classification, overlaid on the original radiograph for clinician-facing transparency.",
  },
  {
    file: "haloscan/clinical.py",
    title: "Protocol engine",
    body: "Maps probability and ambiguity flags to CRITICAL (two-hour endoscopy window), URGENT, or ROUTINE pathways with action checklists, Poison Control contacts, and Reese's Law contextual notes.",
  },
  {
    file: "api/main.py",
    title: "FastAPI service",
    body: "REST endpoints for /api/analyze, /api/report, /api/demo/{case}, and /api/health. Deployed on Render as a Docker container with bundled weights/haloscan.pt (~3.5 MB).",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="page-wide">
      <Nav />

      <header className="doc-header">
        <h1>System Architecture</h1>
        <p className="doc-subtitle">Dual-branch ensemble for pediatric foreign-body radiograph classification</p>
        <p className="doc-meta">
          Technical reference for judges and contributors. Full prose in{" "}
          <a href="https://github.com/arjunkshah12345-hash/haloscan/blob/main/TECHNICAL.md">TECHNICAL.md</a>.
        </p>
      </header>

      <ArchitectureDiagram />

      <section>
        <h2>1. Design Principles</h2>
        <ul className="research">
          <li>
            <strong>Safety-first bias:</strong> False negatives on batteries are costlier than false positives on
            coins in the esophageal emergency window.
          </li>
          <li>
            <strong>Interpretability:</strong> Every inference ships CV overlays, Grad-CAM, and radial charts—not only a
            softmax label.
          </li>
          <li>
            <strong>Dual-view when available:</strong> Lateral morphology reduces stacked-coin false halos on AP
            projection alone.
          </li>
          <li>
            <strong>Offline-capable weights:</strong> Model ships in-repo; no Hugging Face or external API keys
            required for inference.
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Module Reference</h2>
        {MODULES.map((m) => (
          <div key={m.file} className="module-block">
            <h3>
              <code>{m.file}</code> — {m.title}
            </h3>
            <p>{m.body}</p>
          </div>
        ))}
      </section>

      <section>
        <h2>3. Ensemble Fusion Equation</h2>
        <pre>{`battery_prob = 0.55 · P_cv(battery)
             + 0.40 · P_cnn(battery)
             + dual_view_bonus
             + ambiguity_emergency_override

Ambiguity rule:
  if halo_score > 0.40 AND stepoff_score < 0.38:
      flag CRITICAL emergency (stacked-coin conservative policy)`}</pre>
      </section>

      <section>
        <h2>4. Deployment Topology</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Component</th>
              <th>Host</th>
              <th>URL / path</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Marketing + scanner UI</td>
              <td>Vercel (Next.js 15)</td>
              <td>
                <a href="https://haloscan.ideatr.dev">haloscan.ideatr.dev</a>
              </td>
            </tr>
            <tr>
              <td>Inference API</td>
              <td>Render (Docker, free tier)</td>
              <td>haloscan.onrender.com</td>
            </tr>
            <tr>
              <td>Model weights</td>
              <td>Git LFS / bundled in repo</td>
              <td>
                <code>weights/haloscan.pt</code>
              </td>
            </tr>
            <tr>
              <td>CI smoke tests</td>
              <td>GitHub Actions</td>
              <td>
                <code>.github/workflows/test.yml</code>
              </td>
            </tr>
            <tr>
              <td>API keepalive</td>
              <td>GitHub Actions cron</td>
              <td>
                <code>.github/workflows/render-keepalive.yml</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>5. API Surface</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>/api/analyze</code>
              </td>
              <td>POST</td>
              <td>Multipart upload (AP + optional lateral) → full inference JSON</td>
            </tr>
            <tr>
              <td>
                <code>/api/report</code>
              </td>
              <td>POST</td>
              <td>Downloadable HTML clinical report</td>
            </tr>
            <tr>
              <td>
                <code>/api/demo/{"{case}"}</code>
              </td>
              <td>GET</td>
              <td>Live synthetic case (battery, coin, stacked, normal)</td>
            </tr>
            <tr>
              <td>
                <code>/api/health</code>
              </td>
              <td>GET</td>
              <td>Model load status and version</td>
            </tr>
          </tbody>
        </table>
        <div className="cta-row">
          <Link href="/scan" className="btn">
            Try Live API →
          </Link>
          <Link href="/validation" className="btn btn-ghost">
            View Validation Results
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

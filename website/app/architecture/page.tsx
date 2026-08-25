import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

const MODULES = [
  { file: "halo_analyzer.py", title: "Radial halo profiler + multi-peak stacked-coin detector" },
  { file: "models.py", title: "DualViewNet — twin encoders, battery-weighted loss" },
  { file: "inference.py", title: "CV + CNN ensemble fusion and ambiguity rules" },
  { file: "gradcam.py", title: "Grad-CAM explainability overlays" },
  { file: "clinical.py", title: "CRITICAL / URGENT / ROUTINE protocol engine" },
  { file: "api/main.py", title: "FastAPI on Render — /api/analyze, /api/demo, /api/metrics" },
];

export default function ArchitecturePage() {
  return (
    <div className="page">
      <Nav />

      <h1>Architecture</h1>
      <p className="lede">OpenCV radial profiling fused with DualViewNet (PyTorch). Every scan returns explainability images and a clinical protocol.</p>

      <pre>{`AP X-ray → CLAHE → radial halo profiler ─┐
Lateral  → step-off analyzer              ├→ ensemble → verdict + Grad-CAM
         → DualViewNet (CNN)              ─┘`}</pre>

      <ReadMore title="Modules">
        <ul className="plain-list">
          {MODULES.map((m) => (
            <li key={m.file}>
              <code>{m.file}</code> — {m.title}
            </li>
          ))}
        </ul>
      </ReadMore>

      <ReadMore title="Fusion equation">
        <pre>{`battery_prob = 0.50·P_cv + 0.40·P_cnn + dual_bonus

Stacked-coin rule:
  multi_peak AP profile OR stacked_mimic_score ≥ 0.42
  → conservative CRITICAL (false halo trap)`}</pre>
      </ReadMore>

      <ReadMore title="Deployment">
        <ul className="plain-list">
          <li>Frontend: Vercel — haloscan.ideatr.dev</li>
          <li>API: Render Docker — haloscan.onrender.com</li>
          <li>Weights: weights/haloscan.pt (~3.5 MB, bundled)</li>
          <li>CI: GitHub Actions — tests/smoke_test.py on every push</li>
        </ul>
      </ReadMore>

      <p>
        <Link href="/scan">Try live API</Link>
        {" · "}
        <a href="https://github.com/arjunkshah12345-hash/haloscan/blob/main/TECHNICAL.md">TECHNICAL.md</a>
      </p>

      <footer>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </footer>
    </div>
  );
}

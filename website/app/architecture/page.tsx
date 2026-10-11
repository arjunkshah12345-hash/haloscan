import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

const MODULES = [
  { file: "halo_analyzer.py", title: "Radial halo profiler + multi-peak stacked-coin detector" },
  { file: "models.py", title: "DualViewNet — twin encoders, battery-weighted loss" },
  { file: "inference.py", title: "CV + CNN ensemble fusion and ambiguity rules" },
  { file: "gradcam.py", title: "Grad-CAM explainability overlays" },
  { file: "clinical.py", title: "Research readout and uncertainty. No discharge or treatment orders." },
  { file: "api/main.py", title: "FastAPI on Render — /api/analyze, /api/demo, /api/metrics" },
];

export default function ArchitecturePage() {
  return (
    <div className="page">
      <Nav />

      <h1>Architecture</h1>
      <p className="lede">OpenCV radial profiling fused with DualViewNet. Numbers below are the ones in the code, not a simplified diagram.</p>

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
        <pre>{`ViewEncoder: ConvBlock 3→32, 32→64, 64→128, AdaptiveAvgPool → 128
DualViewNet: AP encoder + lateral encoder, concat 256, Linear 256→128→3 classes
Missing lateral: the lateral half of the vector is zeros
Loss weights in classifier.py: [2.5, 1.4, 0.5] for battery, coin, normal
Stacked coins are mapped to the battery class during training

Ensemble in inference.py:
  battery = 0.48·CV + 0.42·CNN + 0.10·(1 − CNN coin)
  +0.06 if a lateral step-off score is above 0.35
Ambiguity: halo > 0.42 and (no lateral or step-off < 0.38), plus stacked-mimic rules
The ambiguity path is a research flag. It is not a clinical order.`}</pre>
      </ReadMore>

      <ReadMore title="Deployment">
        <ul className="plain-list">
          <li>Frontend: Vercel — haloscan-cac.vercel.app</li>
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

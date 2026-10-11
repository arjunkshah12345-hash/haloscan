export function ArchitectureDiagram() {
  return (
    <figure className="architecture-diagram">
      <svg viewBox="0 0 820 420" role="img" aria-label="Haloscan system architecture">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#d6a15a" />
          </marker>
        </defs>

        {/* Inputs */}
        <rect x="20" y="40" width="130" height="56" fill="#f7f7f7" stroke="#111" strokeWidth="1.5" />
        <text x="85" y="64" textAnchor="middle" fontSize="13" fontFamily="Times New Roman, Times, serif" fontWeight="700">
          AP radiograph
        </text>
        <text x="85" y="82" textAnchor="middle" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#555">
          Required
        </text>

        <rect x="20" y="120" width="130" height="56" fill="#f7f7f7" stroke="#111" strokeWidth="1.5" />
        <text x="85" y="144" textAnchor="middle" fontSize="13" fontFamily="Times New Roman, Times, serif" fontWeight="700">
          Lateral radiograph
        </text>
        <text x="85" y="162" textAnchor="middle" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#555">
          Optional
        </text>

        {/* CV branch */}
        <rect x="210" y="30" width="170" height="150" fill="#fff" stroke="#111" strokeWidth="1.5" />
        <text x="295" y="54" textAnchor="middle" fontSize="13" fontFamily="Times New Roman, Times, serif" fontWeight="700">
          Computer vision
        </text>
        <text x="220" y="78" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • CLAHE contrast enhancement
        </text>
        <text x="220" y="96" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • Radial intensity profiling
        </text>
        <text x="220" y="114" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • Hough circle fallback
        </text>
        <text x="220" y="132" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • Lateral step-off score
        </text>
        <text x="220" y="158" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#555" fontStyle="italic">
          halo_analyzer.py
        </text>

        {/* CNN branch */}
        <rect x="210" y="210" width="170" height="150" fill="#fff" stroke="#111" strokeWidth="1.5" />
        <text x="295" y="234" textAnchor="middle" fontSize="13" fontFamily="Times New Roman, Times, serif" fontWeight="700">
          DualViewNet (PyTorch)
        </text>
        <text x="220" y="258" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • AP encoder (32→128 ch)
        </text>
        <text x="220" y="276" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • Lateral encoder
        </text>
        <text x="220" y="294" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • Fusion MLP
        </text>
        <text x="220" y="312" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          • 3× battery-weighted loss
        </text>
        <text x="220" y="338" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#555" fontStyle="italic">
          models.py · weights/haloscan.pt
        </text>

        {/* Ensemble */}
        <rect x="440" y="120" width="150" height="130" fill="#f7f7f7" stroke="#111" strokeWidth="1.5" />
        <text x="515" y="148" textAnchor="middle" fontSize="13" fontFamily="Times New Roman, Times, serif" fontWeight="700">
          Ensemble fusion
        </text>
        <text x="452" y="172" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          55% CV + 40% CNN
        </text>
        <text x="452" y="190" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          + dual-view bonus
        </text>
        <text x="452" y="214" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#333">
          Ambiguity → emergency
        </text>
        <text x="452" y="238" fontSize="11" fontFamily="Times New Roman, Times, serif" fill="#555" fontStyle="italic">
          inference.py
        </text>

        {/* Outputs */}
        <rect x="640" y="40" width="160" height="340" fill="#fff" stroke="#111" strokeWidth="1.5" />
        <text x="720" y="64" textAnchor="middle" fontSize="13" fontFamily="Times New Roman, Times, serif" fontWeight="700">
          Clinical outputs
        </text>
        {[
          "Battery / coin verdict",
          "Confidence & probabilities",
          "Grad-CAM heatmap",
          "Detection overlay",
          "Radial profile chart",
          "Research label and uncertainty",
          "Printable HTML report",
        ].map((line, i) => (
          <text
            key={line}
            x="652"
            y={88 + i * 22}
            fontSize="11"
            fontFamily="Times New Roman, Times, serif"
            fill="#333"
          >
            • {line}
          </text>
        ))}

        {/* Arrows */}
        <line x1="150" y1="68" x2="210" y2="90" stroke="#111" strokeWidth="1.2" markerEnd="url(#arrow)" />
        <line x1="150" y1="148" x2="210" y2="260" stroke="#111" strokeWidth="1.2" markerEnd="url(#arrow)" />
        <line x1="150" y1="148" x2="210" y2="120" stroke="#111" strokeWidth="1.2" markerEnd="url(#arrow)" />
        <line x1="380" y1="105" x2="440" y2="160" stroke="#111" strokeWidth="1.2" markerEnd="url(#arrow)" />
        <line x1="380" y1="285" x2="440" y2="210" stroke="#111" strokeWidth="1.2" markerEnd="url(#arrow)" />
        <line x1="590" y1="185" x2="640" y2="185" stroke="#111" strokeWidth="1.2" markerEnd="url(#arrow)" />

        {/* Deployment strip */}
        <rect x="20" y="360" width="780" height="44" fill="#fafafa" stroke="#ccc" strokeWidth="1" />
        <text x="410" y="387" textAnchor="middle" fontSize="12" fontFamily="Times New Roman, Times, serif" fill="#333">
          Deployment: Vercel (Next.js UI) → Render (FastAPI + PyTorch) · GitHub Actions CI · No PHI stored
        </text>
      </svg>
      <figcaption className="figure-caption">
        <strong>Figure A.</strong> End-to-end Haloscan architecture. Two parallel analysis branches feed an
        ensemble layer that prioritizes battery sensitivity; ambiguous halo cases trigger conservative emergency
        protocols regardless of coin probability.
      </figcaption>
    </figure>
  );
}

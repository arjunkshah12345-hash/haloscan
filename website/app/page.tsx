import Link from "next/link";
import { MinimalFigure } from "@/components/MinimalFigure";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

export default function HomePage() {
  return (
    <div className="page">
      <Nav current="home" />

      <h1>Haloscan</h1>
      <p className="lede">
        AI decision support that distinguishes button batteries from coins on pediatric chest X-rays. Reese&apos;s
        Law fixed packaging — this fixes the diagnosis.
      </p>
      <p>
        <Link href="/scan">Open live scanner</Link>
        {" · "}
        <Link href="/scan?judge=1">90-second judge demo</Link>
        {" · "}
        <a href="https://github.com/arjunkshah12345-hash/haloscan">GitHub</a>
      </p>

      <MinimalFigure
        caseId="battery"
        label="Button battery — CRITICAL"
        caption="Classic double halo on AP view. Haloscan triggers a two-hour endoscopy protocol."
      />
      <MinimalFigure
        caseId="stacked"
        label="Stacked coins — false halo trap"
        caption="Ring-like intensities mimic a battery. Haloscan flags CRITICAL rather than discharging the patient."
      />
      <MinimalFigure
        caseId="coin"
        label="Single coin — ROUTINE"
        caption="No halo mimicry. High coin probability and routine observation pathway."
      />

      <ReadMore title="Abstract">
        <p>
          When a disc-shaped foreign body lodges in a child&apos;s esophagus, clinicians must distinguish a lithium
          button battery from a coin on frontal chest radiography — often within minutes. Stacked coins can
          reproduce the double halo sign. Haloscan fuses OpenCV radial profiling with DualViewNet (PyTorch). On
          synthetic holdout data: 100% battery sensitivity (vs. 81% Emory 2020 baseline), 65% stacked-coin
          emergency catch. Live web app with Grad-CAM, radial charts, and CRITICAL / URGENT / ROUTINE protocols.
        </p>
      </ReadMore>

      <ReadMore title="The problem">
        <p>
          Reese&apos;s Law (P.L. 117-171) passed 409–2 in 2022 — child-resistant packaging, not diagnosis. In the
          ER the question is binary: battery or coin? A battery in the esophagus needs emergent endoscopy within
          ~two hours. A coin in the stomach is often observed.
        </p>
        <p>
          On AP films, batteries show a double halo. Stacked coins can fake it. Rural hospitals may not have
          pediatric radiology at 2 AM. That is the gap Haloscan closes.
        </p>
      </ReadMore>

      <ReadMore title="Results">
        <table className="data">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Haloscan</th>
              <th>Emory 2020</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Battery sensitivity</td>
              <td>100%</td>
              <td>81%</td>
            </tr>
            <tr>
              <td>Stacked-coin emergency catch</td>
              <td>75%</td>
              <td>—</td>
            </tr>
            <tr>
              <td>Coin sensitivity</td>
              <td>38%</td>
              <td>83%</td>
            </tr>
          </tbody>
        </table>
        <p className="muted">
          Haloscan deliberately biases toward battery detection — a missed battery is far costlier than unnecessary
          endoscopy. Lower coin sensitivity reflects this conservative policy (75% stacked-coin catch vs. prior 65%).
        </p>
      </ReadMore>

      <ReadMore title="How it works">
        <p>
          Two branches: (1) OpenCV radial halo profiling with Hough-circle detection, (2) DualViewNet CNN on AP +
          optional lateral views. Outputs are fused with battery-weighted loss. Every scan returns probabilities,
          Grad-CAM, radial profile, and a structured clinical protocol.
        </p>
        <p>
          <Link href="/architecture">Architecture</Link>
          {" · "}
          <Link href="/methodology">Methodology</Link>
          {" · "}
          <Link href="/validation">Validation</Link>
        </p>
      </ReadMore>

      <ReadMore title="More">
        <ul className="plain-list">
          <li>
            <Link href="/gallery">Figure gallery</Link>
          </li>
          <li>
            <Link href="/use-cases">Clinical use cases</Link>
          </li>
          <li>
            <Link href="/judges">Judge verification guide</Link>
          </li>
          <li>
            <a href="https://www.congress.gov/bill/117th-congress/house-bill/5313">Reese&apos;s Law — Congress.gov</a>
          </li>
        </ul>
      </ReadMore>

      <ReadMore title="References">
        <ul className="plain-list">
          <li>
            Rostad CA et al. Machine learning for radiographic diagnosis of button batteries and coins in children.
            <em> Pediatric Radiology</em>, 2020.
          </li>
          <li>Reese&apos;s Law, P.L. 117-171 (15 U.S.C. § 2056e).</li>
          <li>Litovitz T, Whitaker N, Clark L. Preventing battery ingestions: an analysis of 8648 cases. <em>Pediatrics</em>, 2010.</li>
        </ul>
        <p className="muted">
          Full technical documentation:{" "}
          <a href="https://github.com/arjunkshah12345-hash/haloscan/blob/main/TECHNICAL.md">TECHNICAL.md</a>
        </p>
      </ReadMore>

      <footer>
        <p>Decision support only — not a medical device · No patient data stored</p>
      </footer>
    </div>
  );
}

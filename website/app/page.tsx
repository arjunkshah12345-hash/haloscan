import Link from "next/link";
import { MinimalFigure } from "@/components/MinimalFigure";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

export default function HomePage() {
  return (
    <div className="page">
      <Nav current="home" />

      <p className="kicker">Congressional App Challenge 2026 · experimental prototype</p>
      <h1>HaloScan</h1>
      <p className="lede">
        A radial measurement and a small dual-view network, scored on drawn X-rays. Not a diagnosis.
      </p>
      <p>
        Suspected button-battery ingestion needs emergency care regardless of this app. HaloScan does not
        diagnose, rule out a battery, or recommend discharge. Hotline{" "}
        <a href="tel:18004988666">1-800-498-8666</a>.
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
        label="Synthetic button battery"
        caption="A drawn double halo. The scanner shows a battery-like research score, not a treatment order."
      />
      <MinimalFigure
        caseId="stacked"
        label="Synthetic stacked coins"
        caption="Copied rings can look like a halo. The ambiguity flag is a research signal, not a discharge decision."
      />
      <MinimalFigure
        caseId="coin"
        label="Synthetic coin"
        caption="A flat disc. A coin-like score does not rule out a battery and must not be used to send a child home."
      />

      <ReadMore title="Abstract">
        <p>
          When a disc-shaped object is suspected in a child&apos;s esophagus, clinicians distinguish a button battery
          from a coin on radiographs. Stacked coins can copy the double-halo look. HaloScan is a student research
          prototype: OpenCV radial profiles plus a small PyTorch dual-view network, trained and scored on a
          procedural image generator. Those scores are not clinical accuracy. The live scanner shows the image,
          the detected region, both branches, Grad-CAM, and an uncertainty readout.
        </p>
      </ReadMore>

      <ReadMore title="The problem">
        <p>
          Reese&apos;s Law (Public Law 117-171, enacted August 16, 2022) tells the Consumer Product Safety
          Commission to require child-resistant packaging, warning labels, and safer battery compartments. It is
          a prevention law. It does not validate any diagnostic app. The House passed the bill under suspension
          of the rules; the Senate passed it by unanimous consent. A recorded 409–2 vote is not what Congress.gov
          shows for final passage.
        </p>
        <p>
          A button battery lodged in the esophagus can injure tissue within about two hours. That fact is why
          suspected ingestion is an emergency. It is not a result this model is allowed to manage. Poison Control
          and the National Battery Ingestion Hotline (1-800-498-8666) give the public guidance. HaloScan does not.
        </p>
      </ReadMore>

      <h2>What the holdout actually did</h2>
      <p className="muted">
        Forty synthetic images per class, 11 October 2026. Same generator family as training. Not a clinical
        study, and not a comparison with the Emory 2020 radiograph paper.
      </p>
      <table className="data">
        <thead>
          <tr>
            <th>Setup</th>
            <th>Battery flag</th>
            <th>Coin-like</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Frontal image only</td>
            <td>40/40</td>
            <td>40/40</td>
          </tr>
          <tr>
            <td>Frontal plus a separate drawn lateral</td>
            <td>40/40</td>
            <td>0/40</td>
          </tr>
          <tr>
            <td>Classical CV only</td>
            <td>5/40</td>
            <td>40/40</td>
          </tr>
        </tbody>
      </table>
      <p>
        The network follows rings. A second synthetic view made it call every coin a battery. The classical
        branch still separated coins, and barely caught batteries. Wilson 95% for 40/40 starts near 91%.{" "}
        <Link href="/validation">Full report</Link>.
      </p>

      <ReadMore title="How it works">
        <p>
          Two branches: OpenCV radial halo profiling, and DualViewNet on an AP image plus an optional lateral.
          The fusion weights are in inference.py (0.48 classical, 0.42 CNN, plus a small lateral step-off bump).
          Every scan returns uncalibrated scores, Grad-CAM, a radial chart, and a research readout. It does not
          return a care plan.
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
            <Link href="/use-cases">Synthetic examples</Link>
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
        <p>Experimental prototype. Not a medical device. No patient images are stored.</p>
      </footer>
    </div>
  );
}

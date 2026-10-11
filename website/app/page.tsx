import Link from "next/link";
import { MinimalFigure } from "@/components/MinimalFigure";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

export default function HomePage() {
  return (
    <div className="page">
      <Nav current="home" />

      <h1>HaloScan</h1>
      <p className="lede">
        An experimental research prototype that studies how a synthetic-trained model and a radial halo
        detector describe button-battery-like and coin-like discs on X-ray-style images.
      </p>
      <p>
        Suspected button-battery ingestion needs emergency care regardless of anything this app shows. HaloScan
        does not diagnose, rule out a battery, or recommend discharge.
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

      <ReadMore title="What the measurements are">
        <p>
          The numbers in this repository come from the same kind of drawn images the model trained on, plus a
          shifted synthetic set. They are not a clinical trial and they are not a head-to-head with the Emory 2020
          YOLOv2 study on 228 real radiographs. See the <Link href="/validation">evaluation</Link> page for the
          reproducible report, including Wilson intervals. A point estimate of 100% on 40 synthetic images is not
          certainty.
        </p>
      </ReadMore>

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

import Link from "next/link";
import { Nav } from "@/components/Nav";
import { ReadMore } from "@/components/ReadMore";

export default function JudgesPage() {
  return (
    <div className="page">
      <Nav current="judges" />
      <header className="doc-header">
        <h1>Two-minute judge path</h1>
        <p className="doc-subtitle">Congressional App Challenge 2026 · experimental prototype</p>
      </header>

      <p>
        <Link href="/scan?judge=1">Open the scanner in judge mode</Link>. It runs two synthetic cases through the
        model when the API is awake. If the API is down, the same screen says the result is a prerecorded synthetic
        demo and does not pretend a new forward pass happened.
      </p>

      <ReadMore title="What to look at">
        <ol className="research">
          <li>
            Case 1, key <strong>1</strong>: a drawn button battery plus a drawn lateral. Check the source badge
            (live or prerecorded), the radial chart, Grad-CAM, and the separate CV and CNN scores.
          </li>
          <li>
            Case 3, key <strong>3</strong>: stacked coins drawn to copy the halo. Compare the ambiguity flag with
            case 1. The flag is not a treatment order.
          </li>
          <li>
            Case 2, key <strong>2</strong>: a flat coin. A coin-like score does not rule out a battery.
          </li>
          <li>
            Read <Link href="/architecture">the model page</Link> for the real layer sizes and fusion weights, and{" "}
            <Link href="/validation">the evaluation page</Link> for the synthetic holdout, the shifted set, and the
            ablations.
          </li>
        </ol>
      </ReadMore>

      <ReadMore title="What this is not">
        <p>
          HaloScan is not a medical device, not FDA-cleared, and not a substitute for emergency care. Suspected
          button-battery ingestion needs a professional evaluation regardless of the score. Reese&apos;s Law (Public
          Law 117-171) is a packaging and compartment statute. The National Battery Ingestion Hotline is
          1-800-498-8666.
        </p>
        <p>
          Older pages in this project compared a synthetic point estimate with an Emory 2020 study on real
          radiographs. Those datasets are not comparable, and this release does not claim to outperform that study.
        </p>
      </ReadMore>

      <footer>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </footer>
    </div>
  );
}

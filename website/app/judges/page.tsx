import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

export default function JudgesPage() {
  return (
    <>
      <SiteNav current="judges" />
      <main id="main" className="doc-page">
        <div className="doc-page__inner">
          <p className="eyebrow">Congressional App Challenge 2026</p>
          <h1>Two-minute judge path</h1>
          <p className="lede">
            Open the scanner, run two synthetic cases, and read the source badge. The engineering is live when the
            API is awake.
          </p>
          <p>
            <Link className="btn btn--accent" href="/scan?judge=1">
              Open judge demo <span className="arr" aria-hidden>→</span>
            </Link>
          </p>

          <section>
            <h2>What to look at</h2>
            <ol>
              <li>
                Case <strong>1</strong>: drawn button battery. Check live vs prerecorded, radial chart, Grad-CAM,
                classical vs network scores.
              </li>
              <li>
                Case <strong>3</strong>: stacked coins. Compare the ambiguity flag with case 1. It is not a
                treatment order.
              </li>
              <li>
                Case <strong>2</strong>: flat coin. A coin-like score does not rule out a battery.
              </li>
              <li>
                Then read the <Link href="/architecture">model</Link> and{" "}
                <Link href="/validation">evaluation</Link> pages.
              </li>
            </ol>
          </section>

          <section>
            <h2>What this is not</h2>
            <p>
              Not a medical device, not FDA-cleared, not a substitute for emergency care. Reese&apos;s Law is a
              packaging statute. Hotline 1-800-498-8666. This release does not claim to outperform Emory 2020.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

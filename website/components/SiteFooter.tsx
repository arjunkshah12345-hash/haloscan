import Link from "next/link";
import { HaloMark } from "./HaloMark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="site-nav__brand" style={{ marginBottom: "0.75rem" }}>
            <HaloMark />
            HaloScan
          </div>
          <p className="dimmer t-small">
            Experimental research prototype for synthetic disc patterns. Not a medical device.
          </p>
        </div>
        <div>
          <h3 className="t-label">Product</h3>
          <Link href="/scan">Scanner</Link>
          <Link href="/scan?judge=1">Judge demo</Link>
          <Link href="/gallery">Gallery</Link>
        </div>
        <div>
          <h3 className="t-label">Science</h3>
          <Link href="/architecture">Model</Link>
          <Link href="/validation">Evaluation</Link>
          <Link href="/methodology">Methodology</Link>
        </div>
        <div>
          <h3 className="t-label">Safety</h3>
          <a href="tel:18004988666">Battery hotline</a>
          <a href="tel:18002221222">Poison Help</a>
          <a href="https://www.congress.gov/bill/117th-congress/house-bill/5313">Reese&apos;s Law</a>
        </div>
      </div>
      <p className="site-footer__note container">
        Suspected button-battery ingestion needs emergency care regardless of this app. Hotline 1-800-498-8666.
      </p>
    </footer>
  );
}

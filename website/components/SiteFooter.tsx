import Link from "next/link";
import { BrandMark, REPO_URL } from "./SiteNav";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="hatch" aria-hidden />
      <div className="wrap">
        <div className="site-footer__grid">
          <div>
            <span className="brand">
              <BrandMark />
              HaloScan
            </span>
            <p>
              Student research prototype for the 2026 Congressional App Challenge. Synthetic images only. Not a
              medical device and not a diagnosis.
            </p>
          </div>
          <div className="site-footer__col">
            <span className="lab">Use</span>
            <Link href="/scan">Scanner</Link>
            <Link href="/judges">Judge guide</Link>
            <Link href="/gallery">Gallery</Link>
          </div>
          <div className="site-footer__col">
            <span className="lab">Science</span>
            <Link href="/validation">Evaluation</Link>
            <Link href="/architecture">Model</Link>
            <Link href="/methodology">Method</Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              Source code
            </a>
          </div>
          <div className="site-footer__col">
            <span className="lab">Safety</span>
            <a href="tel:18004988666">Battery hotline 1-800-498-8666</a>
            <a href="tel:18002221222">Poison Help 1-800-222-1222</a>
          </div>
        </div>
        <div className="site-footer__base">
          <span>Suspected battery ingestion is an emergency. Call 911 or the hotline.</span>
          <span>CAC 2026</span>
        </div>
      </div>
    </footer>
  );
}

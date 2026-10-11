import Link from "next/link";
import { DitherBenchmark } from "./DitherBenchmark";

export function HeroLaunch() {
  return (
    <section className="hero-launch dither-panel" aria-label="Quick start">
      <div className="hero-launch-inner">
        <div className="hero-launch-copy">
          <p className="hero-eyebrow">Congressional App Challenge 2026 · Research prototype</p>
          <h2 className="hero-title">Reese&apos;s Law fixed packaging. HaloScan measures synthetic discs.</h2>
          <p className="hero-desc">
            Real PyTorch + OpenCV ensemble on drawn X-ray-style images. Press <kbd>1</kbd> then <kbd>3</kbd> on
            the scanner — the stacked-coin case judges should see. Not a medical device.
          </p>
          <div className="cta-row">
            <Link href="/scan?judge=1" className="btn btn-dither">
              Run 90-sec judge demo
            </Link>
            <Link href="/scan" className="btn btn-ghost">
              Open scanner
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <DitherBenchmark />
          <div className="hero-stats-compact">
            <span>
              <strong>Synthetic</strong> holdout labeled
            </span>
            <span>
              <strong>Research</strong> flag only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

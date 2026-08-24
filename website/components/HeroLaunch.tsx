import Link from "next/link";
import { DitherBenchmark } from "./DitherBenchmark";

export function HeroLaunch() {
  return (
    <section className="hero-launch dither-panel" aria-label="Quick start">
      <div className="hero-launch-inner">
        <div className="hero-launch-copy">
          <p className="hero-eyebrow">Congressional App Challenge 2026 · Live ML</p>
          <h2 className="hero-title">Reese&apos;s Law fixed packaging. Haloscan fixes the X-ray.</h2>
          <p className="hero-desc">
            Real PyTorch + OpenCV ensemble. Press <kbd>1</kbd> then <kbd>3</kbd> on the scanner — the
            stacked-coin trap judges should see.
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
              <strong>409–2</strong> Reese&apos;s Law
            </span>
            <span>
              <strong>~2 hr</strong> esophageal window
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

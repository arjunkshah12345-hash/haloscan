import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { HaloMark } from "@/components/HaloMark";

const CASES = [
  {
    id: "battery",
    title: "Button battery",
    caption: "Drawn double halo. Research flag, not a treatment order.",
    src: "/figures/battery/ap.png",
  },
  {
    id: "stacked",
    title: "Stacked coins",
    caption: "Copied rings can look like a halo. Ambiguity is a research signal.",
    src: "/figures/stacked/ap.png",
  },
  {
    id: "coin",
    title: "Single coin",
    caption: "Flat disc. A coin-like score does not rule out a battery.",
    src: "/figures/coin/ap.png",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteNav current="home" />
      <main id="main">
        <section className="hero-band" aria-label="HaloScan">
          <div className="hero-band__inner">
            <p className="eyebrow hero-kicker" data-reveal>
              Congressional App Challenge 2026 · research prototype
            </p>
            <h1 className="hero-title" data-reveal>
              HaloScan
            </h1>
            <p className="hero-sub" data-reveal>
              Measure the halo on drawn X-rays. Classical radial profiling and a dual-view network — labeled
              synthetic, not a diagnosis.
            </p>
            <div className="hero-actions" data-reveal>
              <Link href="/scan" className="btn btn--on-band">
                Open scanner <span className="arr" aria-hidden>→</span>
              </Link>
              <Link href="/scan?judge=1" className="btn btn--ghost-band">
                90-second judge demo
              </Link>
            </div>

            <div className="hero-stage" data-reveal role="img" aria-label="Preview of the HaloScan research scanner">
              <div className="product-window">
                <div className="product-window__bar">
                  <span className="product-window__dots" aria-hidden>
                    <i /><i /><i />
                  </span>
                  <span>haloscan · live bench</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="live-dot" aria-hidden />
                    API ready
                  </span>
                </div>
                <div className="product-window__body">
                  <div className="product-film">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/figures/battery/ap.png" alt="" />
                    <div className="product-film__rings" aria-hidden>
                      <HaloMark className="halo-mark" style={{ width: 96, height: 96, color: "rgba(232,236,242,0.45)" }} />
                    </div>
                  </div>
                  <div className="product-side">
                    <p className="t-label product-side__label">Research readout</p>
                    <p className="product-side__verdict">Battery-like pattern</p>
                    <p className="t-small dimmer">Uncalibrated · synthetic holdout · not clinical probability</p>
                    <div className="meter">
                      <div className="meter__row">
                        <span>Classical</span>
                        <div className="meter__track"><div className="meter__fill meter__fill--cv" style={{ width: "78%" }} /></div>
                        <span className="meter__val">78%</span>
                      </div>
                      <div className="meter__row">
                        <span>Network</span>
                        <div className="meter__track"><div className="meter__fill" style={{ width: "91%" }} /></div>
                        <span className="meter__val">91%</span>
                      </div>
                      <div className="meter__row">
                        <span>Fused</span>
                        <div className="meter__track"><div className="meter__fill" style={{ width: "86%" }} /></div>
                        <span className="meter__val">86%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="page-rest">
          <p className="safety-strip" role="note">
            Suspected button-battery ingestion needs emergency care regardless of this app. HaloScan does not
            diagnose, rule out a battery, or recommend discharge. Hotline{" "}
            <a href="tel:18004988666">1-800-498-8666</a>.
          </p>

          <section className="chapter">
            <div className="chapter__inner">
              <div className="chapter__head" data-reveal>
                <p className="eyebrow">Holdout · 11 Oct 2026</p>
                <h2 className="two-tone">
                  What the measurement found. <span>Forty synthetic images per class. Not a clinical study.</span>
                </h2>
              </div>
              <table className="holdout-table" data-reveal>
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
                    <td>Frontal + separate drawn lateral</td>
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
              <p className="dim" style={{ marginTop: "1.25rem", maxWidth: "40rem" }} data-reveal>
                The network follows rings. A second synthetic view made it call every coin a battery. The classical
                branch still separated coins. Wilson 95% for 40/40 starts near 91%.{" "}
                <Link className="link" href="/validation">
                  Full report
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="chapter">
            <div className="chapter__inner">
              <div className="chapter__head" data-reveal>
                <p className="eyebrow">Synthetic cases</p>
                <h2 className="two-tone">
                  Three films on the bench. <span>All drawn. All labeled.</span>
                </h2>
              </div>
              <div className="case-grid" data-reveal-group>
                {CASES.map((c) => (
                  <Link key={c.id} href={`/scan?case=${c.id}`} className="case-card" data-reveal>
                    <div className="case-card__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.src} alt="" />
                    </div>
                    <div className="case-card__cap">
                      <p className="t-label">{c.title}</p>
                      <p className="t-small dim">{c.caption}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="chapter">
            <div className="chapter__inner">
              <div className="chapter__head" data-reveal>
                <p className="eyebrow">Pipeline</p>
                <h2 className="two-tone">
                  Two branches, one readout. <span>OpenCV radial profile · DualViewNet · ensemble.</span>
                </h2>
                <p className="dim" style={{ marginTop: "1rem" }}>
                  Fusion weights live in <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.85em" }}>inference.py</code>.
                  Grad-CAM and the radial chart ship with every live pass. No care plan is returned.{" "}
                  <Link className="link" href="/architecture">
                    Model explorer
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <section className="finale">
            <div className="finale__inner" data-reveal>
              <h2>Open the bench.</h2>
              <div className="hero-actions">
                <Link href="/scan" className="btn btn--accent">
                  Run the scanner <span className="arr" aria-hidden>→</span>
                </Link>
                <Link href="/judges" className="btn btn--ghost">
                  Judge guide
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

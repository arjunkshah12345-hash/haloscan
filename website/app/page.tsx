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
              A swallowed button battery can burn through a child&apos;s esophagus in about two hours, and on an
              X-ray it can look almost exactly like a coin. HaloScan is a student research prototype that studies
              that look-alike problem on synthetic X-rays. It is not a diagnosis.
            </p>
            <div className="hero-actions" data-reveal>
              <Link href="/scan" className="btn btn--on-band">
                Explore the Demo <span className="arr" aria-hidden>→</span>
              </Link>
              <Link href="/judges" className="btn btn--ghost-band">
                Judge guide
              </Link>
            </div>

            <div className="hero-stage" data-reveal role="img" aria-label="Preview of the HaloScan research scanner">
              <div className="product-window">
                <div className="product-window__bar">
                  <span className="product-window__dots" aria-hidden>
                    <i /><i /><i />
                  </span>
                  <span>haloscan · illustration</span>
                  <span>Static preview · not a live result</span>
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
                <p className="eyebrow">The main result</p>
                <h2 className="two-tone">
                  A failure mode, found and guarded.{" "}
                  <span>Synthetic images, 40 per class. Not a clinical study.</span>
                </h2>
              </div>
              <ol className="pipe-flow" data-reveal aria-label="Failure found, guard added, result">
                <li>
                  <span className="pipe-flow__n">11 Oct</span>
                  <strong>Failure found</strong>
                  <span>
                    When a second (side) view was added, the neural network called every synthetic coin a battery:
                    0/40 coins recognized.
                  </span>
                </li>
                <li>
                  <span className="pipe-flow__n">Why</span>
                  <strong>Cause</strong>
                  <span>
                    The network learned to follow rings, and the drawn side views were not real projections of the
                    same object.
                  </span>
                </li>
                <li>
                  <span className="pipe-flow__n">12 Oct</span>
                  <strong>Guard added</strong>
                  <span>
                    If the two-view network says battery but the front-only network and classical image analysis
                    both say coin, the app trusts the front-only network.
                  </span>
                </li>
                <li>
                  <span className="pipe-flow__n">Result</span>
                  <strong>40/40 coins recovered</strong>
                  <span>Same 40 synthetic coins, re-run 12 Oct with the guard on.</span>
                </li>
              </ol>
              <table className="holdout-table" data-reveal style={{ marginTop: "1.5rem" }}>
                <caption className="t-small dim" style={{ captionSide: "bottom", textAlign: "left", paddingTop: "0.75rem" }}>
                  Synthetic holdout, 40 images per class. Battery flag means the app raised a research flag. It is
                  not detection accuracy on real patients.
                </caption>
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Battery flag</th>
                    <th>Coin-like</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>11 Oct · front + side view, no guard</td>
                    <td>40/40</td>
                    <td>0/40</td>
                  </tr>
                  <tr>
                    <td>12 Oct · front + side view, with guard</td>
                    <td>40/40</td>
                    <td>40/40</td>
                  </tr>
                  <tr>
                    <td>12 Oct · harder, shifted image generator</td>
                    <td>40/40</td>
                    <td>5/40</td>
                  </tr>
                </tbody>
              </table>
              <div className="callout" role="note">
                <strong>Limits.</strong> These are pattern-recognition results on drawn images, not medical
                detection performance. On the harder shifted generator, only 5 of 40 coins were recognized as coins.
                Stacked coins are often called battery-like or ambiguous, and normal images with no object usually
                come back coin-like. The 40/40 battery flag says the app flags ring patterns readily. It is not an
                accuracy claim.{" "}
                <Link className="link" href="/validation">
                  Full evaluation
                </Link>
                .
              </div>
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
              </div>
              <ol className="pipe-flow" data-reveal aria-label="HaloScan inference pipeline">
                <li>
                  <span className="pipe-flow__n">01</span>
                  <strong>Image in</strong>
                  <span>AP required. Lateral optional — not assumed to help.</span>
                </li>
                <li>
                  <span className="pipe-flow__n">02</span>
                  <strong>Classical CV</strong>
                  <span>CLAHE, disc localize, radial halo / stacked-mimic scores.</span>
                </li>
                <li>
                  <span className="pipe-flow__n">03</span>
                  <strong>Neural net</strong>
                  <span>AP-only and dual-view DualViewNet softmax scores.</span>
                </li>
                <li>
                  <span className="pipe-flow__n">04</span>
                  <strong>Fusion + explain</strong>
                  <span>Ensemble with dual-view collapse guard, Grad-CAM, radial chart.</span>
                </li>
              </ol>
              <p className="dim" style={{ marginTop: "1.25rem" }} data-reveal>
                The two-view network (DualViewNet) alone still fails on synthetic coins with a side view. The guard
                described above is what keeps the combined readout from following it. Details in{" "}
                <Link className="link" href="/architecture">
                  the model page
                </Link>{" "}
                and{" "}
                <Link className="link" href="/validation">
                  evaluation
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="finale">
            <div className="finale__inner" data-reveal>
              <h2>Open the bench.</h2>
              <div className="hero-actions">
                <Link href="/scan" className="btn btn--accent">
                  Explore the Demo <span className="arr" aria-hidden>→</span>
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

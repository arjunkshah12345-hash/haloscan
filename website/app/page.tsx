import fs from "fs";
import path from "path";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav, REPO_URL } from "@/components/SiteNav";

type Rate = { count: number; n: number };
type Report = {
  holdout_ensemble: { confusion: { true_labels: string[]; predicted_buckets: string[]; matrix: number[][] } };
  shifted_ensemble: { coin_pattern_rate: Rate };
  ablations: { name: string; coin_pattern_rate: Rate }[];
};

function loadReport(): Report {
  const p = path.join(process.cwd(), "public/figures/validation/eval_report.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as Report;
}

const PRETTY: Record<string, string> = {
  battery: "Battery",
  coin: "Coin",
  stacked_coins: "Stacked",
  normal: "Normal",
  ambiguous: "Ambiguous",
};

const CASES = [
  {
    id: "battery",
    key: "A",
    title: "Button battery",
    caption: "Drawn double ring. Should raise the research flag.",
    src: "/figures/battery/ap.png",
  },
  {
    id: "coin",
    key: "B",
    title: "Single coin",
    caption: "Flat disc with a side view. The guard keeps it coin-like.",
    src: "/figures/coin/ap.png",
  },
  {
    id: "stacked",
    key: "C",
    title: "Stacked coins",
    caption: "Copied rings that mimic a battery. Flagged, not recognized.",
    src: "/figures/stacked/ap.png",
  },
];

const FAQ = [
  {
    q: "Is this a medical device?",
    a: "No. HaloScan is a student research prototype. It does not diagnose, rule out a battery, or recommend care. A suspected battery ingestion is an emergency regardless of what any app says.",
  },
  {
    q: "Were real X-rays used?",
    a: "No. Every image is drawn by a procedural generator. The numbers measure pattern recognition on those drawings, not medical detection performance.",
  },
  {
    q: "Does the side view help?",
    a: "Not measurably. Front-only and front + side give identical results on the holdout. The side view mainly exposed the failure that the guard now blocks.",
  },
  {
    q: "Why does an empty image come back coin-like?",
    a: "The classifier only chooses between battery-like and coin-like patterns, so it has no reliable 'nothing here' answer. A coin-like output does not mean a coin is present.",
  },
  {
    q: "Was AI used to build it?",
    a: "Yes, AI coding tools were used and are disclosed in the submission. The disclosure and the student's own contributions are listed there and in the repository.",
  },
];

export default function HomePage() {
  const report = loadReport();
  const coin = (name: string) => report.ablations.find((a) => a.name === name)?.coin_pattern_rate;
  const bars = [
    { label: "Classical image analysis only", sub: "front view", rate: coin("cv_only") },
    { label: "Neural network, front view", sub: "ensemble", rate: coin("ap_only") },
    { label: "Two-view network alone", sub: "front + side · the failure", rate: coin("cnn_only") },
    { label: "Ensemble with guard", sub: "front + side · 12 Oct", rate: coin("ap_plus_lateral"), hl: true },
    { label: "Shifted image generator", sub: "harder images · limitation", rate: report.shifted_ensemble.coin_pattern_rate },
  ];
  const conf = report.holdout_ensemble.confusion;

  return (
    <>
      <SiteNav current="home" />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <canvas id="heroField" className="hero__field" aria-hidden />
          <div className="wrap hero__grid">
            <div className="hero__copy">
              <span className="lab">Congressional App Challenge 2026 · Student research prototype</span>
              <h1 id="hero-title">Button battery, or coin?</h1>
              <p className="lede">
                A swallowed button battery can burn through a child&apos;s esophagus in about two hours. On an X-ray it
                can look almost exactly like a coin. HaloScan studies that look-alike problem on synthetic X-rays, and
                shows where its own model fails.
              </p>
              <div className="btn-row">
                <Link href="/scan" className="btn">
                  Run the scanner →
                </Link>
                <Link href="/judges" className="btn btn--ghost">
                  Judge guide
                </Link>
              </div>
              <p className="dimmer" style={{ fontSize: 14 }}>
                Not a medical device. Suspected ingestion: call 911 or the battery hotline{" "}
                <a className="link" href="tel:18004988666">
                  1-800-498-8666
                </a>
                .
              </p>
            </div>
            <figure className="hero__figure">
              <canvas
                className="film"
                data-film
                data-src="/figures/battery/ap.png"
                role="img"
                aria-label="Dithered synthetic X-ray of a button battery showing a double ring"
              />
              <figcaption>
                <span>Synthetic battery · front view</span>
                <span>Drawn, not a patient</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="section" aria-labelledby="result-title">
          <div className="wrap">
            <div className="section__inner reveal">
              <div className="section__head">
                <span className="lab">01 · The result</span>
                <div>
                  <h2 id="result-title">A failure mode, found and guarded.</h2>
                  <p className="lede">
                    Adding a second, side-view image made the neural network call every synthetic coin a battery.
                    A simple guard fixed it on the same 40 coins.
                  </p>
                </div>
              </div>
              <div className="stats">
                <div className="stat">
                  <span className="lab">11 Oct · no guard</span>
                  <span className="stat__n">
                    0<small>/40</small>
                  </span>
                  <p>Coins recognized when a side view was added. The network had learned to follow rings.</p>
                </div>
                <div className="stat is-hl">
                  <span className="lab lab--accent">12 Oct · with guard</span>
                  <span className="stat__n">
                    40<small>/40</small>
                  </span>
                  <p>
                    If the two-view network says battery but the front-only network and classical analysis both say
                    coin, trust the front-only network.
                  </p>
                </div>
                <div className="stat">
                  <span className="lab">12 Oct · shifted images</span>
                  <span className="stat__n">
                    5<small>/40</small>
                  </span>
                  <p>Coins recognized on a harder, shifted generator. Results do not transfer well.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="limits-title">
          <div className="wrap">
            <div className="section__inner reveal">
              <div className="section__head">
                <span className="lab">02 · Measured</span>
                <div>
                  <h2 id="limits-title">Coin-like rate by configuration.</h2>
                  <p className="lede">
                    Synthetic holdout, 40 coins each. Pattern recognition on drawn images, not medical accuracy.
                  </p>
                </div>
              </div>
              <div className="bars" role="img" aria-label="Coin-like rate by configuration">
                {bars.map((b) => (
                  <div key={b.label} className="bar" data-meter={b.rate?.count ?? 0} data-max={b.rate?.n ?? 40} {...(b.hl ? { "data-hl": "" } : {})}>
                    <span className="bar__label">
                      {b.label}
                      <small>{b.sub}</small>
                    </span>
                    <canvas aria-hidden />
                    <span className="bar__val">
                      {b.rate?.count}/{b.rate?.n}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 48 }}>
                <span className="lab" style={{ marginBottom: 14 }}>
                  What each synthetic image was called · holdout, ensemble
                </span>
                <div className="heat" data-heat role="img" aria-label="Confusion matrix of true label versus called label">
                  <div className="heat__row heat__head" style={{ ["--cols" as string]: conf.predicted_buckets.length }}>
                    <span>True ↓ / called →</span>
                    {conf.predicted_buckets.map((b) => (
                      <span key={b}>{PRETTY[b] ?? b}</span>
                    ))}
                  </div>
                  {conf.true_labels.map((t, i) => (
                    <div key={t} className="heat__row" style={{ ["--cols" as string]: conf.predicted_buckets.length }}>
                      <span className="heat__label">{PRETTY[t] ?? t}</span>
                      {conf.matrix[i].map((v, j) => (
                        <span key={j} className="heat__cell">
                          <canvas data-v={v / 40} aria-hidden />
                          <span>{v}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="note" style={{ marginTop: 32 }}>
                <strong>Limits.</strong> Stacked coins are never recognized as stacks, only flagged as battery-like or
                ambiguous. Empty images are called coin-like 39 of 40 times, so a coin-like output does not mean a coin
                is present. The side view adds no measurable benefit. Every battery is flagged (40/40), which shows the
                app flags rings readily; it is not an accuracy claim.{" "}
                <Link className="link" href="/validation">
                  Full evaluation
                </Link>
                .
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="how-title">
          <div className="wrap">
            <div className="section__inner reveal">
              <div className="section__head">
                <span className="lab">03 · How it works</span>
                <div>
                  <h2 id="how-title">Two ways of looking, one readout.</h2>
                </div>
              </div>
              <ol className="steps">
                <li>
                  <span className="lab">01</span>
                  <strong>Image in</strong>
                  <p>Front view required. A side view is optional.</p>
                </li>
                <li>
                  <span className="lab">02</span>
                  <strong>Classical analysis</strong>
                  <p>OpenCV measures brightness in rings outward from the disc center.</p>
                </li>
                <li>
                  <span className="lab">03</span>
                  <strong>Neural network</strong>
                  <p>A small PyTorch network scores the front view, and the side view when present.</p>
                </li>
                <li className="is-hl">
                  <span className="lab">04</span>
                  <strong>Guarded fusion</strong>
                  <p>Scores are combined, the guard is applied, and a heatmap shows where the network looked.</p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="cases-title">
          <div className="wrap">
            <div className="section__inner reveal">
              <div className="section__head">
                <span className="lab">04 · Try it</span>
                <div>
                  <h2 id="cases-title">Three synthetic cases.</h2>
                  <p className="lede">Each runs the live model. A badge says whether a result is live or prerecorded.</p>
                </div>
              </div>
              <div className="cases">
                {CASES.map((c) => (
                  <Link key={c.id} href={`/scan?case=${c.id}`} className="case">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.src} alt="" loading="lazy" />
                    <span className="case__cap">
                      <span className="lab">Case {c.key}</span>
                      <strong>{c.title}</strong>
                      <p>{c.caption}</p>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="faq-title">
          <div className="wrap">
            <div className="section__inner reveal">
              <div className="section__head">
                <span className="lab">05 · Questions</span>
                <div>
                  <h2 id="faq-title">Straight answers.</h2>
                </div>
              </div>
              <div className="faq">
                {FAQ.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="cta-title">
          <div className="wrap">
            <div className="section__inner cta reveal">
              <div>
                <span className="lab" style={{ marginBottom: 16 }}>
                  Open source
                </span>
                <h2 id="cta-title">Run it, then read the code.</h2>
              </div>
              <div className="btn-row">
                <Link href="/scan?judge=1" className="btn">
                  Judge walkthrough →
                </Link>
                <a href={REPO_URL} className="btn btn--ghost" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

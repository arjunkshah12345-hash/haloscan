"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type Halo = {
  halo_score: number;
  stepoff_score: number;
  battery_score: number;
  coin_score: number;
};

type Protocol = {
  urgency: string;
  color: string;
  time_window: string;
  actions: string[];
  contacts: string[];
  reese_law_note: string;
};

type Result = {
  prediction: string;
  confidence: number;
  battery_probability: number;
  coin_probability: number;
  emergency: boolean;
  ambiguous: boolean;
  explanation: string;
  inference_ms: number;
  ap_halo: Halo;
  lat_halo: Halo | null;
  dual_view_used: boolean;
  model_probs: Record<string, number>;
  cv_probs: Record<string, number>;
  protocol: Protocol;
  overlay_b64: string;
  gradcam_b64: string;
  radial_chart_b64: string;
};

type Metrics = {
  haloscan?: { battery_sensitivity: number; stacked_coin_emergency_rate: number };
  baseline_emory_2020?: { battery_sensitivity: number };
};

const CASES = [
  { id: "battery", title: "Button battery", sub: "AP + lateral · Case 1", key: "1", fig: "/figures/battery/ap.png" },
  { id: "coin", title: "Single coin", sub: "AP only · Case 2", key: "2", fig: "/figures/coin/ap.png" },
  { id: "stacked", title: "Stacked coins", sub: "False halo · Case 3", key: "3", fig: "/figures/stacked/ap.png" },
  { id: "normal", title: "Normal study", sub: "No foreign body · Case 4", key: "4", fig: "/figures/normal/ap.png" },
];

const PIPELINE_STEPS = [
  "Connecting to inference API…",
  "CLAHE contrast + disc localization",
  "Radial halo profiling (OpenCV)",
  "DualViewNet forward pass (PyTorch)",
  "Ensemble fusion + Grad-CAM + protocol",
];

export function ScanApp() {
  const searchParams = useSearchParams();
  const judgeMode = searchParams.get("judge") === "1";
  const caseParam = searchParams.get("case");

  const [apFile, setApFile] = useState<File | null>(null);
  const [latFile, setLatFile] = useState<File | null>(null);
  const [apPreview, setApPreview] = useState<string | null>(null);
  const [latPreview, setLatPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [apiLive, setApiLive] = useState<boolean | null>(null);
  const [apiWarming, setApiWarming] = useState(false);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [judgeBanner, setJudgeBanner] = useState(judgeMode);
  const [showHelp, setShowHelp] = useState(false);
  const [nudgeCase3, setNudgeCase3] = useState(false);
  const lastDemo = useRef<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const judgeStarted = useRef(false);
  const caseStarted = useRef(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    let step = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    if (loading) {
      setLoadStep(0);
      timer = setInterval(() => {
        step = Math.min(step + 1, PIPELINE_STEPS.length - 1);
        setLoadStep(step);
      }, 900);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  useEffect(() => {
    const warm = async () => {
      setApiWarming(true);
      try {
        const h = await fetch("/api/health");
        const hd = h.ok ? await h.json() : null;
        setApiLive(!!hd?.model);
        if (hd?.model) {
          await fetch("/api/demo/battery").catch(() => null);
        }
        const m = await fetch("/api/metrics").catch(() => null);
        if (m?.ok) setMetrics(await m.json());
      } catch {
        setApiLive(false);
      } finally {
        setApiWarming(false);
      }
    };
    warm();
  }, []);

  const onFile = (file: File, kind: "ap" | "lat") => {
    if (!file.type.startsWith("image/")) {
      notify("Upload an image file");
      return;
    }
    const url = URL.createObjectURL(file);
    if (kind === "ap") {
      setApFile(file);
      setApPreview(url);
    } else {
      setLatFile(file);
      setLatPreview(url);
    }
    lastDemo.current = null;
    setActiveCase(null);
  };

  const runDemo = useCallback(
    async (id: string) => {
      setLoading(true);
      setActiveCase(id);
      lastDemo.current = id;
      try {
        const [res, prev] = await Promise.all([
          fetch(`/api/demo/${id}`),
          fetch(`/api/demo/${id}/previews`).catch(() => null),
        ]);
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err.includes("timeout") ? "API waking up — try again in 30s" : err.slice(0, 120));
        }
        setResult(await res.json());
        if (prev?.ok) {
          const p = await prev.json();
          if (p.ap_b64) setApPreview(p.ap_b64);
          setLatPreview(p.lateral_b64 ?? null);
        }
        scrollToResults();
        notify(`Case ${CASES.find((c) => c.id === id)?.key} — live inference complete`);
        if (id === "battery") setNudgeCase3(true);
        else if (id === "stacked") setNudgeCase3(false);
      } catch (e) {
        notify(e instanceof Error ? e.message : "Demo failed");
      } finally {
        setLoading(false);
      }
    },
    [notify, scrollToResults],
  );

  const runJudgeDemo = useCallback(async () => {
    setJudgeBanner(true);
    notify("Judge demo: Case 1 (battery) → then Case 3 (stacked coins)");
    await runDemo("battery");
    await new Promise((r) => setTimeout(r, 2500));
    notify("Now running Case 3 — the false-halo trap");
    await runDemo("stacked");
  }, [notify, runDemo]);

  useEffect(() => {
    if (judgeMode && !judgeStarted.current && apiLive) {
      judgeStarted.current = true;
      const t = setTimeout(() => runJudgeDemo(), 800);
      return () => clearTimeout(t);
    }
  }, [judgeMode, apiLive, runJudgeDemo]);

  const analyze = async () => {
    if (!apFile) return;
    setLoading(true);
    lastDemo.current = null;
    setActiveCase(null);
    const form = new FormData();
    form.append("ap", apFile);
    if (latFile) form.append("lateral", latFile);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
      scrollToResults();
      notify("Analysis complete — real upload inference");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    setLoading(true);
    try {
      let res: Response;
      if (lastDemo.current) {
        res = await fetch(`/api/demo/${lastDemo.current}/report`);
      } else if (apFile) {
        const form = new FormData();
        form.append("ap", apFile);
        if (latFile) form.append("lateral", latFile);
        res = await fetch("/api/report", { method: "POST", body: form });
      } else return;
      const html = await res.text();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      a.download = `haloscan-report-${Date.now()}.html`;
      a.click();
      notify("Clinical report downloaded");
    } catch {
      notify("Report failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseParam && apiLive && !caseStarted.current && CASES.some((c) => c.id === caseParam)) {
      caseStarted.current = true;
      runDemo(caseParam);
    }
  }, [caseParam, apiLive, runDemo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "?") {
        setShowHelp((v) => !v);
        return;
      }
      if (e.key === "Escape") setShowHelp(false);
      const map: Record<string, string> = { "1": "battery", "2": "coin", "3": "stacked", "4": "normal" };
      if (map[e.key]) runDemo(map[e.key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runDemo]);

  const r = result;
  const verdictClass = r?.emergency ? "critical" : r?.prediction.includes("COIN") ? "routine" : "urgent";
  const batSens = metrics?.haloscan?.battery_sensitivity;
  const emory = metrics?.baseline_emory_2020?.battery_sensitivity;

  return (
    <div className="scan-root">
      <header className="scan-header dither-accent">
        <div className="scan-brand">
          <div>
            <h1>Haloscan Clinical Scanner</h1>
            <span>Live PyTorch + OpenCV ensemble · Reese&apos;s Law (P.L. 117-171)</span>
          </div>
        </div>
        <div className="scan-nav">
          <span className={`status-pill ${apiLive ? "live" : apiWarming ? "warm" : ""}`}>
            {apiWarming ? "Warming API…" : apiLive === null ? "Connecting…" : apiLive ? "API online" : "API offline"}
          </span>
          <Link href="/">Home</Link>
          <Link href="/judges">Judges</Link>
          <button type="button" className="scan-help-btn" onClick={() => setShowHelp(true)} title="Keyboard shortcuts">
            ?
          </button>
          <a href="https://github.com/arjunkshah12345-hash/haloscan" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </header>

      {judgeBanner && (
        <div className="judge-banner">
          <div className="judge-banner-inner">
            <strong>Judge quick demo</strong>
            <span>
              Press <kbd>1</kbd> for battery (CRITICAL) · <kbd>3</kbd> for stacked coins (false halo trap) · Real
              inference, not cached JSON
            </span>
            <button type="button" className="btn-judge-run" onClick={runJudgeDemo} disabled={loading || !apiLive}>
              Run both cases automatically
            </button>
            <button type="button" className="btn-judge-dismiss" onClick={() => setJudgeBanner(false)} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="example-strip">
        <div className="example-strip-head">
          <h2>Reference cases — live server inference</h2>
          <p>Keys 1–4 · Each click runs the full Haloscan pipeline on Render</p>
        </div>
        <div className="example-grid">
          {CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`example-card scan-example-card-dither ${activeCase === c.id ? "active" : ""}`}
              onClick={() => runDemo(c.id)}
            >
              <span className="example-key">{c.key}</span>
              <img src={c.fig} alt={c.title} />
              <div className="example-card-body">
                <strong>{c.title}</strong>
                <span>{c.sub}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="compare-strip">
        <div className="compare-strip-item">
          <img src="/figures/battery/ap.png" alt="Battery" />
          <span>Case 1 · True battery</span>
        </div>
        <div className="compare-strip-mid">vs</div>
        <div className="compare-strip-item trap">
          <img src="/figures/stacked/ap.png" alt="Stacked coins" />
          <span>Case 3 · False halo trap</span>
        </div>
        <p className="compare-strip-note">Haloscan flags both as emergencies — that&apos;s the point.</p>
      </div>

      <div className="scan-layout">
        <section className="scan-panel">
          <h2>Upload radiographs</h2>
          <p className="scan-lead">
            AP view required. Lateral optional — improves stacked-coin discrimination via DualViewNet.
          </p>

          <label
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0], "ap");
            }}
          >
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0], "ap")} />
            {!apPreview ? (
              <>
                <strong>AP (frontal) radiograph</strong>
                <span className="dropzone-hint">Click or drag to upload</span>
              </>
            ) : (
              <img src={apPreview} alt="AP" />
            )}
          </label>

          <label
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0], "lat");
            }}
          >
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0], "lat")} />
            {!latPreview ? (
              <>
                <strong>Lateral radiograph</strong>
                <span className="dropzone-hint">Optional · dual-view fusion</span>
              </>
            ) : (
              <img src={latPreview} alt="Lateral" />
            )}
          </label>

          <button className="btn-analyze" disabled={!apFile || loading} onClick={analyze}>
            Run full ensemble analysis
          </button>
        </section>

        <section className="scan-panel scan-results" ref={resultsRef}>
          <h2>Analysis output</h2>
          {!r ? (
            <div className="results-empty">
              <p className="results-empty-lead">No analysis yet</p>
              <p>Click a reference case above or press <kbd>1</kbd> to start.</p>
              <p className="results-empty-hook">
                <strong>For judges:</strong> Case <kbd>1</kbd> = battery CRITICAL · Case <kbd>3</kbd> = stacked coins
                false halo
              </p>
              <button type="button" className="btn-judge-inline" onClick={runJudgeDemo} disabled={loading || !apiLive}>
                Run 90-second judge demo
              </button>
            </div>
          ) : (
            <>
              <div className="verdict-badges">
                {r.emergency && <span className="badge badge-critical">EMERGENCY</span>}
                {r.ambiguous && <span className="badge badge-ambiguous">Ambiguous halo</span>}
                {r.dual_view_used && <span className="badge badge-dual">Dual-view fusion</span>}
                <span className="badge badge-live">Live inference · {r.inference_ms.toFixed(0)} ms</span>
              </div>

              <div className={`verdict ${verdictClass}`}>
                <div className="verdict-title">{r.prediction}</div>
                <div className="verdict-meta">
                  {(r.confidence * 100).toFixed(1)}% confidence · Protocol: <strong>{r.protocol.urgency}</strong>
                </div>
              </div>

              {r.emergency && (
                <div className="emergency-strip pulse">
                  <span className="emergency-icon">⚠</span>
                  Two-hour esophageal window — treat as battery until endoscopy excludes lodgement
                </div>
              )}

              {nudgeCase3 && activeCase === "battery" && (
                <div className="nudge-case3">
                  <p>
                    <strong>Judge checkpoint:</strong> Now run Case 3 — stacked coins fake the halo but still trigger
                    CRITICAL.
                  </p>
                  <button type="button" className="btn-judge-run" onClick={() => runDemo("stacked")} disabled={loading}>
                    Run Case 3 (stacked coins) →
                  </button>
                </div>
              )}

              <div className="prob-row">
                <span>Battery</span>
                <div className="bar-track">
                  <div className="bar-fill bar-bat" style={{ width: `${r.battery_probability * 100}%` }} />
                </div>
                <span>{(r.battery_probability * 100).toFixed(0)}%</span>
              </div>
              <div className="prob-row">
                <span>Coin</span>
                <div className="bar-track">
                  <div className="bar-fill bar-coin" style={{ width: `${r.coin_probability * 100}%` }} />
                </div>
                <span>{(r.coin_probability * 100).toFixed(0)}%</span>
              </div>

              <div className="ensemble">
                <strong>Ensemble decomposition</strong>
                <div className="ensemble-grid">
                  <div>
                    <span className="ensemble-label">CV branch</span>
                    {(r.cv_probs.battery * 100).toFixed(0)}% battery
                    <div className="mini-bar">
                      <div className="bar-fill bar-bat" style={{ width: `${r.cv_probs.battery * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="ensemble-label">CNN branch</span>
                    {((r.model_probs.battery ?? 0) * 100).toFixed(0)}% battery
                    <div className="mini-bar">
                      <div className="bar-fill bar-bat" style={{ width: `${(r.model_probs.battery ?? 0) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="ensemble-label">Fused</span>
                    {(r.battery_probability * 100).toFixed(0)}% battery
                    <div className="mini-bar">
                      <div className="bar-fill bar-bat" style={{ width: `${r.battery_probability * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <p className="explanation">{r.explanation}</p>

              <div className="img-grid">
                <figure>
                  <figcaption>Detection overlay</figcaption>
                  <img src={r.overlay_b64} alt="Overlay" />
                </figure>
                <figure>
                  <figcaption>Grad-CAM</figcaption>
                  <img src={r.gradcam_b64} alt="Grad-CAM" />
                </figure>
                <figure>
                  <figcaption>Radial profile</figcaption>
                  <img src={r.radial_chart_b64} alt="Radial" />
                </figure>
              </div>

              <div className="protocol">
                <h3 style={{ color: r.protocol.color }}>{r.protocol.urgency} — Clinical protocol</h3>
                <p className="protocol-window">{r.protocol.time_window}</p>
                <ul>
                  {r.protocol.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                {r.protocol.contacts.map((c) => (
                  <p key={c} className="protocol-contact">
                    {c}
                  </p>
                ))}
                <p className="protocol-reese">{r.protocol.reese_law_note}</p>
              </div>

              <div className="actions">
                <button type="button" className="btn-sec" onClick={downloadReport}>
                  Download HTML report
                </button>
                <button
                  type="button"
                  className="btn-sec"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Haloscan: ${r.prediction}\nBattery ${(r.battery_probability * 100).toFixed(0)}%\n${r.protocol.urgency}\n${r.explanation}`,
                    );
                    notify("Summary copied");
                  }}
                >
                  Copy summary
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="scan-panel scan-aside">
          <h2>Why Haloscan wins</h2>
          <div className="stat-cards">
            <div className="stat-card highlight">
              <span className="stat-val">{batSens != null ? `${(batSens * 100).toFixed(0)}%` : "100%"}</span>
              <span className="stat-lbl">Battery sensitivity</span>
            </div>
            <div className="stat-card">
              <span className="stat-val">{emory != null ? `${(emory * 100).toFixed(0)}%` : "81%"}</span>
              <span className="stat-lbl">Emory 2020 baseline</span>
            </div>
            <div className="stat-card">
              <span className="stat-val">65%</span>
              <span className="stat-lbl">Stacked-coin catch</span>
            </div>
          </div>
          <ul className="scan-sidebar-list">
            <li>Reese&apos;s Law fixed packaging — not diagnosis</li>
            <li>Stacked coins mimic the double halo sign</li>
            <li>Grad-CAM + radial charts for transparency</li>
            <li>No PHI stored · open source MIT</li>
          </ul>
          <div className="aside-links">
            <Link href="/validation">Validation figures →</Link>
            <Link href="/architecture">Architecture →</Link>
          </div>
          <p className="aside-disclaimer">Decision support only — not a medical device.</p>
        </aside>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="pipeline-panel">
            <div className="spinner" />
            <p className="pipeline-title">{PIPELINE_STEPS[loadStep]}</p>
            <ul className="pipeline-steps">
              {PIPELINE_STEPS.map((s, i) => (
                <li key={s} className={i <= loadStep ? "done" : ""}>
                  {s}
                </li>
              ))}
            </ul>
            {apiWarming && <p className="pipeline-note">First request may take ~30s while the cloud API wakes up.</p>}
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)} role="presentation">
          <div className="help-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
            <h3>Keyboard shortcuts</h3>
            <table>
              <tbody>
                {CASES.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <kbd>{c.key}</kbd>
                    </td>
                    <td>{c.title}</td>
                    <td>{c.sub}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <kbd>?</kbd>
                  </td>
                  <td colSpan={2}>
                    Toggle this help
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="help-tip">Judge path: press 1 → then 3. Or use &ldquo;Run judge demo&rdquo; above.</p>
            <button type="button" className="btn-sec" onClick={() => setShowHelp(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

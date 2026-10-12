"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HaloMark } from "./HaloMark";

type Halo = {
  halo_score: number;
  stepoff_score: number;
  battery_score: number;
  coin_score: number;
  profile_peaks?: number;
  stacked_mimic_score?: number;
};

type Protocol = {
  urgency: string;
  color: string;
  time_window: string;
  actions: string[];
  contacts: string[];
  reese_law_note: string;
  research_label?: string;
  uncertainty?: string;
  safety?: string;
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
  stacked_mimic?: boolean;
  inference_source?: string;
  synthetic_label?: string;
  synthetic_demo?: boolean;
};

type Metrics = {
  haloscan?: { battery_sensitivity?: number; stacked_coin_emergency_rate?: number };
  baseline_emory_2020?: { battery_sensitivity?: number };
  holdout_ensemble?: { battery_research_flag_sensitivity?: { rate?: number } };
  clinical_accuracy?: boolean;
};

const CASES = [
  {
    id: "battery",
    letter: "A",
    title: "Battery-like",
    sub: "Synthetic double halo · AP + lateral",
    truth: "Ground truth: synthetic button battery",
    why: "Concentric rings on the frontal image. The research flag should fire.",
    key: "1",
    fig: "/figures/battery/ap.png",
  },
  {
    id: "coin",
    letter: "B",
    title: "Single coin",
    sub: "Synthetic flat disc · AP + lateral (shows collapse guard)",
    truth: "Ground truth: synthetic single coin",
    why: "Homogeneous disc. DualViewNet alone still collapses this class with a lateral; the ensemble guard recovers coin-like when AP-only CNN and classical agree.",
    key: "2",
    fig: "/figures/coin/ap.png",
  },
  {
    id: "stacked",
    letter: "C",
    title: "Stacked coins",
    sub: "Synthetic multi-ring mimic · AP",
    truth: "Ground truth: synthetic stacked coins",
    why: "Copied rings can look like a battery halo. Ambiguity is the honest research signal.",
    key: "3",
    fig: "/figures/stacked/ap.png",
  },
  {
    id: "normal",
    letter: "D",
    title: "No disc",
    sub: "Synthetic background",
    truth: "Ground truth: no foreign body drawn",
    why: "Control background. Not a negative clinical study.",
    key: "4",
    fig: "/figures/normal/ap.png",
  },
];

const PIPELINE_STEPS = [
  "Connecting to inference API…",
  "CLAHE contrast + disc localization",
  "Radial halo profiling (OpenCV)",
  "DualViewNet forward pass (PyTorch)",
  "Ensemble fusion + Grad-CAM",
];

const SAFETY =
  "Suspected button-battery ingestion needs immediate professional emergency evaluation regardless of this prototype. HaloScan does not diagnose, rule out a battery, recommend discharge, or delay care.";

function researchLabel(r: Result): string {
  if (r.protocol?.research_label) return r.protocol.research_label;
  if (r.ambiguous || r.stacked_mimic) {
    if (/coin/i.test(r.prediction) && !/battery/i.test(r.prediction)) return "AMBIGUOUS — COIN-LEANING";
    return "AMBIGUOUS — BATTERY-LIKE PATTERN";
  }
  if (/battery/i.test(r.prediction)) return "BATTERY-LIKE PATTERN";
  if (/coin/i.test(r.prediction)) return "COIN-LIKE PATTERN";
  return "NO DISC PATTERN";
}

function sourceLabel(r: Result): string {
  if (r.inference_source === "live") return `Live inference · ${r.inference_ms.toFixed(0)} ms`;
  if (r.inference_source === "prerecorded_research_demo") return "Prerecorded synthetic demo · not a new forward pass";
  return `Unlabeled result · ${r.inference_ms.toFixed(0)} ms`;
}

function safeNotes(actions: string[] | undefined): string[] {
  const banned = /\b(discharge|npo|endoscop|surgery|two-hour|2-hour|treat as battery)\b/i;
  const kept = (actions || []).filter((line) => !banned.test(line));
  if (kept.length > 0) return kept;
  return [
    "Scores are uncalibrated outputs of an experimental model trained on synthetic discs.",
    "A coin-like or no-disc result does not rule out a button battery.",
  ];
}

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
  const [apiDetail, setApiDetail] = useState<string | null>(null);
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
        const live = hd?.model === "loaded" || hd?.model === true;
        setApiLive(!!live);
        setApiDetail(
          live
            ? null
            : hd?.detail ||
              "Inference API is offline or waking up. Reference cases may fall back to labeled prerecorded demos. Uploads need a live API.",
        );
        if (live) {
          await fetch("/api/demo/battery").catch(() => null);
        }
        const m = await fetch("/api/metrics").catch(() => null);
        if (m?.ok) setMetrics(await m.json());
      } catch {
        setApiLive(false);
        setApiDetail("Could not reach the inference API. Uploads will fail until it responds.");
      } finally {
        setApiWarming(false);
      }
    };
    warm();
  }, []);

  const resetBench = () => {
    setApFile(null);
    setLatFile(null);
    setApPreview(null);
    setLatPreview(null);
    setResult(null);
    setActiveCase(null);
    lastDemo.current = null;
    setNudgeCase3(false);
  };

  const onFile = (file: File, kind: "ap" | "lat") => {
    if (!file.type.startsWith("image/")) {
      notify("Upload a PNG, JPEG, or WebP image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify("Image must be 8 MB or smaller");
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
      setApFile(null);
      setLatFile(null);
      try {
        const [res, prev] = await Promise.all([
          fetch(`/api/demo/${id}`),
          fetch(`/api/demo/${id}/previews`).catch(() => null),
        ]);
        if (!res.ok) {
          const err = await res.text();
          throw new Error(
            err.includes("timeout") || res.status === 503
              ? "Inference API unavailable. No result was invented. Try again when the API is awake."
              : err.slice(0, 160),
          );
        }
        const data = (await res.json()) as Result;
        setResult(data);
        if (prev?.ok) {
          const p = await prev.json();
          if (p.ap_b64) setApPreview(p.ap_b64);
          setLatPreview(p.lateral_b64 ?? null);
        } else {
          const fig = CASES.find((c) => c.id === id)?.fig;
          if (fig) setApPreview(fig);
          setLatPreview(null);
        }
        scrollToResults();
        const letter = CASES.find((c) => c.id === id)?.letter || "?";
        notify(
          data.inference_source === "live"
            ? `Case ${letter} — live inference on a synthetic sample`
            : `Case ${letter} — labeled prerecorded demo (API did not run a new forward pass)`,
        );
        if (id === "battery") setNudgeCase3(true);
        else if (id === "stacked") setNudgeCase3(false);
      } catch (e) {
        setResult(null);
        notify(e instanceof Error ? e.message : "Demo failed");
      } finally {
        setLoading(false);
      }
    },
    [notify, scrollToResults],
  );

  const runJudgeDemo = useCallback(async () => {
    setJudgeBanner(true);
    notify("Judge walkthrough: Case A (battery) → Case B (coin) → Case C (stacked)");
    await runDemo("battery");
    await new Promise((r) => setTimeout(r, 1800));
    await runDemo("coin");
    await new Promise((r) => setTimeout(r, 1800));
    await runDemo("stacked");
  }, [notify, runDemo]);

  useEffect(() => {
    if (judgeMode && !judgeStarted.current && !apiWarming && apiLive !== null) {
      judgeStarted.current = true;
      const t = setTimeout(() => runJudgeDemo(), 800);
      return () => clearTimeout(t);
    }
  }, [judgeMode, apiLive, apiWarming, runJudgeDemo]);

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
      if (!res.ok) {
        const raw = await res.text();
        let detail = `Analysis failed (HTTP ${res.status}).`;
        try {
          const body = JSON.parse(raw) as { error?: string; detail?: string };
          detail = body.error || body.detail || detail;
        } catch {
          detail = raw.slice(0, 180) || detail;
        }
        throw new Error(
          res.status === 503
            ? "Inference API unavailable. Uploaded images are not analyzed with a prerecorded substitute."
            : detail,
        );
      }
      const data = (await res.json()) as Result;
      if (data.inference_source && data.inference_source !== "live") {
        throw new Error("Unexpected non-live analyze response. Refusing to show a substituted result.");
      }
      setResult({ ...data, inference_source: "live" });
      scrollToResults();
      notify("Analysis complete — live inference on the uploaded image");
    } catch (e) {
      setResult(null);
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
      notify("Research report downloaded");
    } catch {
      notify("Report failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseParam && apiLive !== null && !apiWarming && !caseStarted.current && CASES.some((c) => c.id === caseParam)) {
      caseStarted.current = true;
      runDemo(caseParam);
    }
  }, [caseParam, apiLive, apiWarming, runDemo]);

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
  const verdictClass = !r
    ? "routine"
    : r.ambiguous
      ? "ambiguous"
      : /coin/i.test(researchLabel(r))
        ? "coin"
        : /battery/i.test(researchLabel(r))
          ? "battery"
          : "routine";
  const batSens =
    metrics?.haloscan?.battery_sensitivity ??
    metrics?.holdout_ensemble?.battery_research_flag_sensitivity?.rate;
  const emory = metrics?.baseline_emory_2020?.battery_sensitivity;

  return (
    <div className="scan-root">
      <header className="scan-top">
        <Link href="/" className="scan-top__brand">
          <HaloMark />
          HaloScan
        </Link>
        <div className="scan-top__meta">
          <span className="status-chip">
            <span className={`live-dot${apiLive ? "" : " live-dot--off"}`} aria-hidden />
            {apiWarming ? "Checking API" : apiLive === null ? "…" : apiLive ? "Live API" : "API offline"}
          </span>
          <Link href="/judges">Judges</Link>
          <button type="button" className="link-btn" onClick={() => setShowHelp(true)} aria-label="Keyboard shortcuts">
            Shortcuts
          </button>
        </div>
      </header>

      <p className="scan-safety" role="note">
        {SAFETY} Hotline <a href="tel:18004988666">1-800-498-8666</a>. Poison Help{" "}
        <a href="tel:18002221222">1-800-222-1222</a>.
      </p>

      {apiDetail && (
        <p className="scan-api-banner" role="status">
          {apiDetail}
        </p>
      )}

      <section className="demo-intro">
        <div className="demo-intro__copy">
          <p className="eyebrow">Interactive demonstration</p>
          <h1>Pick a reference case</h1>
          <p>
            Three synthetic films for judges. Click a card — no keyboard required. Optional shortcuts:{" "}
            <kbd>1</kbd>–<kbd>4</kbd>.
          </p>
        </div>
        <div className="demo-intro__actions">
          <button type="button" className="btn btn--accent" onClick={runJudgeDemo} disabled={loading || apiWarming}>
            Run A → B → C walkthrough
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetBench} disabled={loading}>
            Reset bench
          </button>
        </div>
      </section>

      {judgeBanner && (
        <p className="scan-judge">
          Judge walkthrough armed. Watch the source badge on each result: <strong>Live</strong> vs{" "}
          <strong>Prerecorded</strong>.
        </p>
      )}

      <div className="case-rail" role="list">
        {CASES.filter((c) => c.id !== "normal").map((c) => (
          <button
            key={c.id}
            type="button"
            role="listitem"
            className={`case-tile ${activeCase === c.id ? "active" : ""}`}
            onClick={() => runDemo(c.id)}
            disabled={loading}
          >
            <span className="case-tile__letter" aria-hidden>
              {c.letter}
            </span>
            <span className="case-tile__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.fig} alt="" />
            </span>
            <span className="case-tile__copy">
              <strong>{c.title}</strong>
              <span>{c.sub}</span>
              <span className="case-tile__truth">{c.truth}</span>
            </span>
          </button>
        ))}
        <button
          type="button"
          role="listitem"
          className={`case-tile case-tile--quiet ${activeCase === "normal" ? "active" : ""}`}
          onClick={() => runDemo("normal")}
          disabled={loading}
        >
          <span className="case-tile__letter" aria-hidden>
            D
          </span>
          <span className="case-tile__copy">
            <strong>No disc</strong>
            <span>Optional control background</span>
          </span>
        </button>
      </div>

      <div className="scan-bench">
        <section className="bench-panel">
          <h2>Upload your own</h2>
          <p className="bench-lead">
            AP required. Lateral optional — fused when present, not assumed to help. Needs a live API; no silent demo substitute.
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
                <strong>AP (frontal)</strong>
                <span className="dropzone-hint">Click or drag · PNG / JPEG / WebP</span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apPreview} alt="AP preview" />
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
                <strong>Lateral (optional)</strong>
                <span className="dropzone-hint">A second view is fused, not assumed to help</span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={latPreview} alt="Lateral preview" />
            )}
          </label>

          <button className="btn-analyze" disabled={!apFile || loading} onClick={analyze}>
            Run ensemble
          </button>
        </section>

        <section className="bench-panel" ref={resultsRef}>
          <h2>Readout</h2>
          {loading ? (
            <div className="scan-loading">
              <HaloMark className="halo-mark ring-loader" />
              <p>{PIPELINE_STEPS[loadStep] || "Working…"}</p>
            </div>
          ) : !r ? (
            <div className="results-empty">
              <p className="results-empty-lead">No analysis yet</p>
              <p>Click Case A, B, or C above. Judges can also run the A → B → C walkthrough.</p>
              <button type="button" className="btn-judge-inline" onClick={runJudgeDemo} disabled={loading || apiWarming}>
                Run A → B → C walkthrough
              </button>
            </div>
          ) : (
            <>
              <div className="verdict-badges">
                <span className={`badge ${r.inference_source === "live" ? "badge-live" : "badge-prerecorded"}`}>
                  {r.inference_source === "live" ? "Live inference" : "Prerecorded demo"}
                </span>
                {r.emergency && <span className="badge badge-critical">Research flag</span>}
                {r.ambiguous && <span className="badge badge-ambiguous">Ambiguous pattern</span>}
                {r.dual_view_used && <span className="badge badge-dual">Dual-view path used</span>}
                <span className="badge">{sourceLabel(r)}</span>
              </div>

              {activeCase && (
                <p className="ground-truth">
                  {CASES.find((c) => c.id === activeCase)?.truth}.{" "}
                  <span className="dim">{CASES.find((c) => c.id === activeCase)?.why}</span>
                </p>
              )}

              <div className={`verdict ${verdictClass}`}>
                <div className="verdict-title">{researchLabel(r)}</div>
                <div className="verdict-meta">
                  Uncalibrated model score {(r.confidence * 100).toFixed(1)} (not a diagnostic probability) · uncertainty{" "}
                  {r.protocol.uncertainty || "unspecified"}
                </div>
              </div>

              <p className="safety-inline">{r.protocol.safety || SAFETY}</p>
              {r.synthetic_label && <p className="synthetic-label">{r.synthetic_label}</p>}

              {r.ambiguous && (
                <div className="emergency-strip">
                  Ambiguous radial pattern. This is a research flag, not a treatment order and not a reason to delay emergency care.
                </div>
              )}

              {nudgeCase3 && activeCase === "battery" && (
                <div className="nudge-case3">
                  <p>
                    <strong>Next:</strong> Case B (coin) then Case C (stacked coins). Compare live vs prerecorded badges and the ambiguity flag.
                  </p>
                  <button type="button" className="btn-judge-run" onClick={() => runDemo("coin")} disabled={loading}>
                    Run Case B (coin) →
                  </button>
                </div>
              )}

              <div className="ensemble-grid ensemble-grid-open">
                <div>
                  <span className="ensemble-label">Classical CV</span>
                  {(r.cv_probs.battery * 100).toFixed(0)}% battery-like
                  <span className="ensemble-sub">{(r.cv_probs.coin * 100).toFixed(0)}% coin-like</span>
                </div>
                <div>
                  <span className="ensemble-label">Neural net</span>
                  {((r.model_probs.battery ?? 0) * 100).toFixed(0)}% battery-like
                  <span className="ensemble-sub">{((r.model_probs.coin ?? 0) * 100).toFixed(0)}% coin-like</span>
                </div>
                <div>
                  <span className="ensemble-label">Fused score</span>
                  {(r.battery_probability * 100).toFixed(0)}% battery-like
                  <span className="ensemble-sub">Uncalibrated · not a probability</span>
                </div>
              </div>

              <div className="prob-row">
                <span>Battery-like</span>
                <div className="bar-track">
                  <div className="bar-fill bar-bat" style={{ width: `${r.battery_probability * 100}%` }} />
                </div>
                <span>{(r.battery_probability * 100).toFixed(0)}%</span>
              </div>
              <div className="prob-row">
                <span>Coin-like</span>
                <div className="bar-track">
                  <div className="bar-fill bar-coin" style={{ width: `${r.coin_probability * 100}%` }} />
                </div>
                <span>{(r.coin_probability * 100).toFixed(0)}%</span>
              </div>

              <div className="branch-meters" aria-label="Classical and network scores">
                <div>
                  <span className="ensemble-label">Classical CV · battery</span>
                  <div className="bar-track">
                    <div className="bar-fill bar-cv" style={{ width: `${r.cv_probs.battery * 100}%` }} />
                  </div>
                  <span className="meter-value">{(r.cv_probs.battery * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="ensemble-label">CNN · battery</span>
                  <div className="bar-track">
                    <div className="bar-fill bar-cnn" style={{ width: `${(r.model_probs.battery ?? 0) * 100}%` }} />
                  </div>
                  <span className="meter-value">{((r.model_probs.battery ?? 0) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="img-grid">
                {r.overlay_b64 && (
                  <figure>
                    <figcaption>Detected region</figcaption>
                    <img src={r.overlay_b64} alt="Detected disc overlay" />
                  </figure>
                )}
                {r.gradcam_b64 && (
                  <figure>
                    <figcaption>Grad-CAM</figcaption>
                    <img src={r.gradcam_b64} alt="Grad-CAM heatmap for the battery class" />
                  </figure>
                )}
                {r.radial_chart_b64 && (
                  <figure>
                    <figcaption>Radial intensity</figcaption>
                    <img src={r.radial_chart_b64} alt="Radial intensity profile" />
                  </figure>
                )}
                {apPreview && (
                  <figure>
                    <figcaption>Original AP</figcaption>
                    <img src={apPreview} alt="Original frontal synthetic image" />
                  </figure>
                )}
              </div>

              <p className="explanation">{r.explanation}</p>

              <details className="scan-details">
                <summary>Radiographic features</summary>
                <ul className="feature-list">
                  <li>AP halo score: {r.ap_halo.halo_score.toFixed(2)}</li>
                  <li>AP radial peaks: {r.ap_halo.profile_peaks ?? 0}</li>
                  <li>Stacked-coin mimic: {(r.ap_halo.stacked_mimic_score ?? 0).toFixed(2)}{r.stacked_mimic ? " · flagged" : ""}</li>
                  {r.lat_halo && <li>Lateral step-off: {r.lat_halo.stepoff_score.toFixed(2)}</li>}
                  <li>CV battery / coin: {(r.cv_probs.battery * 100).toFixed(0)}% / {(r.cv_probs.coin * 100).toFixed(0)}%</li>
                  <li>CNN battery / coin: {((r.model_probs.battery ?? 0) * 100).toFixed(0)}% / {((r.model_probs.coin ?? 0) * 100).toFixed(0)}%</li>
                </ul>
              </details>

              <details className="scan-details">
                <summary>Research readout — {researchLabel(r)}</summary>
                <div className="protocol">
                  <p className="protocol-window">{r.protocol.time_window}</p>
                  <ul>
                    {safeNotes(r.protocol.actions).map((a) => (
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
              </details>

              <div className="hero-actions" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={downloadReport}>
                  Download report
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `HaloScan research readout: ${researchLabel(r)}\nUncalibrated battery-like score ${(r.battery_probability * 100).toFixed(0)}%\nSource: ${r.inference_source || "unlabeled"}\n${SAFETY}`,
                    );
                    notify("Summary copied");
                  }}
                >
                  Copy summary
                </button>
              </div>

              <details className="scan-details">
                <summary>About these numbers</summary>
                <p className="explanation">
                  Synthetic point estimates
                  {batSens != null ? ` (battery-flag ${(batSens * 100).toFixed(0)}%)` : ""} are not clinical
                  sensitivity and are not a comparison with Emory 2020
                  {emory != null ? ` (${(emory * 100).toFixed(0)}% on a different dataset)` : ""}. Not a medical
                  device. Not FDA cleared.
                </p>
              </details>
            </>
          )}
        </section>
      </div>

      {toast && <div className="scan-toast">{toast}</div>}

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)} role="presentation">
          <div className="help-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts">
            <h3>Shortcuts</h3>
            <ul>
              {CASES.map((c) => (
                <li key={c.id}>
                  <kbd>{c.key}</kbd> {c.title} — {c.sub}
                </li>
              ))}
              <li>
                <kbd>?</kbd> Toggle this help
              </li>
            </ul>
            <p className="explanation">Judge path: 1 then 3, or run the automatic demo.</p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowHelp(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

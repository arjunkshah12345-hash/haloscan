"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HaloMark } from "./HaloMark";
import { SiteNav } from "./SiteNav";

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
};

type SampleId = "battery" | "coin" | "stacked" | "empty";

// Synthetic test images. Loading one puts the file in the uploader; it is then
// analyzed by the same live /api/analyze call as any uploaded image.
const SAMPLES: { id: SampleId; title: string; file: string; side?: string }[] = [
  { id: "battery", title: "Button battery", file: "/samples/synthetic-battery.png", side: "/samples/synthetic-battery-side.png" },
  { id: "coin", title: "Single coin", file: "/samples/synthetic-coin.png" },
  { id: "stacked", title: "Stacked coins", file: "/samples/synthetic-stacked-coins.png" },
  { id: "empty", title: "No object", file: "/samples/synthetic-empty.png" },
];

const PIPELINE_STEPS = [
  "Uploading image",
  "CLAHE contrast + disc localization",
  "Radial halo profiling (OpenCV)",
  "Neural network forward pass (PyTorch)",
  "Ensemble fusion + Grad-CAM",
];

const SAFETY =
  "Suspected button-battery ingestion needs immediate professional emergency evaluation regardless of this prototype. HaloScan does not diagnose, rule out a battery, recommend discharge, or delay care.";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function researchLabel(r: Result): string {
  // The API's own ambiguous label says which way the pattern leans; keep it.
  if (/ambiguous/i.test(r.prediction)) return r.prediction.toUpperCase();
  if (r.ambiguous || r.stacked_mimic) {
    if (/coin/i.test(r.prediction) && !/battery/i.test(r.prediction)) return "AMBIGUOUS — COIN-LEANING";
    return "AMBIGUOUS — BATTERY-LIKE PATTERN";
  }
  if (/battery/i.test(r.prediction)) return "BATTERY-LIKE PATTERN";
  if (/coin/i.test(r.prediction)) return "COIN-LIKE PATTERN";
  return "NO DISC PATTERN";
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

async function fileFromUrl(url: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], url.split("/").pop() || "sample.png", { type: blob.type || "image/png" });
}

export function ScanApp() {
  const searchParams = useSearchParams();
  const sampleParam = (searchParams.get("sample") || searchParams.get("case")) as string | null;

  const [apFile, setApFile] = useState<File | null>(null);
  const [latFile, setLatFile] = useState<File | null>(null);
  const [apPreview, setApPreview] = useState<string | null>(null);
  const [latPreview, setLatPreview] = useState<string | null>(null);
  const [sampleId, setSampleId] = useState<SampleId | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [apiLive, setApiLive] = useState<boolean | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const sampleLoaded = useRef(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
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

  // The free API host sleeps when idle. Poll health until it is awake so the
  // status chip flips to online without a reload.
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const check = async () => {
      try {
        const h = await fetch("/api/health", { cache: "no-store" });
        const hd = h.ok ? await h.json() : null;
        const live = hd?.model === "loaded" || hd?.model === true;
        if (cancelled) return;
        setApiLive(!!live);
        if (live) return;
      } catch {
        if (!cancelled) setApiLive(false);
      }
      if (!cancelled && ++tries < 24) setTimeout(check, 5000);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const setInput = useCallback((file: File, kind: "ap" | "lat") => {
    const url = URL.createObjectURL(file);
    if (kind === "ap") {
      setApFile(file);
      setApPreview(url);
    } else {
      setLatFile(file);
      setLatPreview(url);
    }
  }, []);

  const onFile = (file: File, kind: "ap" | "lat") => {
    if (!file.type.startsWith("image/")) {
      notify("Upload a PNG, JPEG, or WebP image");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      notify("Image must be 4 MB or smaller (JPEG or PNG).");
      return;
    }
    if (kind === "ap") setSampleId(null);
    setInput(file, kind);
  };

  const clearInputs = () => {
    setApFile(null);
    setLatFile(null);
    setApPreview(null);
    setLatPreview(null);
    setSampleId(null);
    setResult(null);
    setResultPreview(null);
  };

  const loadSample = useCallback(
    async (id: SampleId, withSide = false) => {
      const s = SAMPLES.find((x) => x.id === id);
      if (!s) return;
      try {
        setInput(await fileFromUrl(s.file), "ap");
        if (withSide && s.side) setInput(await fileFromUrl(s.side), "lat");
        else {
          setLatFile(null);
          setLatPreview(null);
        }
        setSampleId(id);
        setResult(null);
      } catch {
        notify("Could not load the sample image");
      }
    },
    [notify, setInput],
  );

  useEffect(() => {
    if (sampleLoaded.current || !sampleParam) return;
    const id = (sampleParam === "normal" ? "empty" : sampleParam) as SampleId;
    if (SAMPLES.some((s) => s.id === id)) {
      sampleLoaded.current = true;
      loadSample(id);
    }
  }, [sampleParam, loadSample]);

  const analyze = async () => {
    if (!apFile) return;
    // Vercel rejects request bodies over ~4.5 MB before they reach the API
    if (apFile.size + (latFile?.size ?? 0) > MAX_UPLOAD_BYTES) {
      notify("Images are too large. Keep the front and side views under 4 MB combined (JPEG or PNG).");
      return;
    }
    setLoading(true);
    const form = new FormData();
    form.append("ap", apFile);
    if (latFile) form.append("lateral", latFile);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      if (!res.ok) {
        const raw = await res.text();
        let detail = `Analysis failed (HTTP ${res.status}).`;
        try {
          const body = JSON.parse(raw) as { error?: unknown; detail?: unknown };
          const msg = body.error ?? body.detail;
          if (typeof msg === "string") detail = msg;
        } catch {
          // Non-JSON bodies are platform errors (e.g. Vercel 413); keep the generic message
        }
        throw new Error(
          res.status === 503 || res.status === 504
            ? "The analysis server is waking up. Wait a few seconds and press Analyze again."
            : res.status === 413
              ? "Images are too large. Keep the front and side views under 4 MB combined (JPEG or PNG)."
              : res.status === 429
                ? "Too many analyses in a minute. Wait a moment and try again."
                : detail,
        );
      }
      const data = (await res.json()) as Result;
      if (data.inference_source && data.inference_source !== "live") {
        throw new Error("Unexpected non-live response. Refusing to show a substituted result.");
      }
      setResult({ ...data, inference_source: "live" });
      setResultPreview(apPreview);
      setApiLive(true);
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setResult(null);
      notify(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!apFile) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("ap", apFile);
      if (latFile) form.append("lateral", latFile);
      const res = await fetch("/api/report", { method: "POST", body: form });
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

  return (
    <div className="scan-root">
      <SiteNav current="scan" />

      <section className="demo-intro">
        <div className="demo-intro__copy">
          <span className="lab">Scanner · live engine</span>
          <h1>Analyze an X-ray</h1>
          <p>
            Upload a front-view image, or load one of the synthetic samples below. Each analysis runs the classical
            radial profiler and the neural network on the server, then fuses them.
          </p>
        </div>
        <div className="demo-intro__actions">
          <span className="status-chip" role="status">
            <span className={`live-dot${apiLive ? "" : " live-dot--off"}`} aria-hidden />
            {apiLive === null ? "Checking engine" : apiLive ? "Engine online" : "Engine waking up"}
          </span>
        </div>
      </section>

      <p className="scan-safety" role="note">
        Research prototype, synthetic images only. {SAFETY} Hotline <a href="tel:18004988666">1-800-498-8666</a>.
      </p>

      <div className="scan-bench">
        <section className="bench-panel">
          <h2>Input</h2>

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
                <strong>Front view (required)</strong>
                <span className="dropzone-hint">Click or drag · PNG / JPEG / WebP · up to 4 MB</span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apPreview} alt="Front view to analyze" />
            )}
          </label>

          <label
            className="dropzone dropzone--side"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0], "lat");
            }}
          >
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0], "lat")} />
            {!latPreview ? (
              <>
                <strong>Side view (optional)</strong>
                <span className="dropzone-hint">Showed no measurable benefit in testing</span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={latPreview} alt="Side view to analyze" />
            )}
          </label>

          <div className="analyze-row">
            <button className="btn-analyze" disabled={!apFile || loading} onClick={analyze}>
              {loading ? "Analyzing…" : "Analyze"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={clearInputs} disabled={loading || (!apFile && !r)}>
              Clear
            </button>
          </div>

          <div className="samples">
            <span className="lab">Synthetic samples · computer-drawn, not patient images</span>
            <ul>
              {SAMPLES.map((s) => (
                <li key={s.id} className={sampleId === s.id ? "is-active" : undefined}>
                  <button type="button" className="sample" onClick={() => loadSample(s.id)} disabled={loading}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.file} alt="" />
                    <span>{s.title}</span>
                  </button>
                  <a className="sample__dl" href={s.file} download aria-label={`Download ${s.title} sample image`}>
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
              <p>Add a front-view image on the left, then press Analyze.</p>
            </div>
          ) : (
            <>
              <div className="verdict-badges">
                <span className="badge badge-live">Live inference</span>
                {r.emergency && <span className="badge badge-critical">Research flag</span>}
                {r.ambiguous && <span className="badge badge-ambiguous">Ambiguous pattern</span>}
                {r.dual_view_used && <span className="badge badge-dual">Side view used</span>}
                <span className="badge">{(r.inference_ms / 1000).toFixed(1)} s on server</span>
              </div>

              <div className={`verdict ${verdictClass}`}>
                <div className="verdict-title">{researchLabel(r)}</div>
                <div className="verdict-meta">
                  Uncalibrated model score {(r.confidence * 100).toFixed(1)} (not a diagnostic probability) · uncertainty{" "}
                  {r.protocol.uncertainty || "unspecified"}
                </div>
              </div>

              {!r.ambiguous && researchLabel(r) === "COIN-LIKE PATTERN" && (
                <p className="synthetic-label">
                  {sampleId === "empty"
                    ? "This image has no object in it. HaloScan only chooses between battery-like and coin-like patterns, so empty images usually come back coin-like. "
                    : "HaloScan is a limited research classifier. "}
                  A coin-like output does not mean a coin is present, and it does not rule out a battery.
                </p>
              )}

              {r.ambiguous && (
                <div className="emergency-strip">
                  Ambiguous radial pattern. This is a research flag, not a treatment order and not a reason to delay
                  emergency care.
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
                  <span className="ensemble-label">Combined</span>
                  {(r.battery_probability * 100).toFixed(0)}% battery-like
                  <span className="ensemble-sub">Uncalibrated · not a probability</span>
                </div>
              </div>

              <p className="ensemble-note">
                Classical scores are independent ring and flat-disc measurements, so they need not add to 100%. When
                both are high, the pattern is ambiguous.
              </p>

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

              <div className="img-grid">
                {r.radial_chart_b64 && (
                  <figure>
                    <figcaption>Radial intensity profile</figcaption>
                    <img src={r.radial_chart_b64} alt="Radial intensity profile around the detected object" />
                  </figure>
                )}
                {r.gradcam_b64 && (
                  <figure>
                    <figcaption>Grad-CAM · where the network looked</figcaption>
                    <img src={r.gradcam_b64} alt="Grad-CAM heatmap for the battery class" />
                  </figure>
                )}
                {r.overlay_b64 && (
                  <figure>
                    <figcaption>Detected region</figcaption>
                    <img src={r.overlay_b64} alt="Detected disc overlay" />
                  </figure>
                )}
                {resultPreview && (
                  <figure>
                    <figcaption>Input image</figcaption>
                    <img src={resultPreview} alt="The analyzed front-view image" />
                  </figure>
                )}
              </div>

              <p className="explanation">{r.explanation}</p>

              <details className="scan-details">
                <summary>Radiographic features</summary>
                <ul className="feature-list">
                  <li>Front-view halo score: {r.ap_halo.halo_score.toFixed(2)}</li>
                  <li>Radial peaks: {r.ap_halo.profile_peaks ?? 0}</li>
                  <li>
                    Stacked-coin mimic: {(r.ap_halo.stacked_mimic_score ?? 0).toFixed(2)}
                    {r.stacked_mimic ? " · flagged" : ""}
                  </li>
                  {r.lat_halo && <li>Side-view step-off: {r.lat_halo.stepoff_score.toFixed(2)}</li>}
                </ul>
              </details>

              <details className="scan-details">
                <summary>Research notes</summary>
                <div className="protocol">
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
                </div>
              </details>

              <p className="safety-inline">{SAFETY}</p>

              <div className="btn-row" style={{ marginTop: "1rem" }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={downloadReport} disabled={loading}>
                  Download report
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {toast && (
        <div className="scan-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

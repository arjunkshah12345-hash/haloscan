import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const BACKEND = process.env.HALOSCAN_API_URL?.replace(/\/$/, "");

const DEMO_CASES = new Set(["battery", "coin", "stacked", "normal"]);

const SAFETY =
  "Suspected button-battery ingestion requires immediate professional emergency evaluation regardless of this prototype's output. HaloScan does not diagnose, rule out a battery, recommend discharge, or replace emergency care.";

function researchLabel(prediction: string, ambiguous: boolean): string {
  if (ambiguous) {
    if (/coin/i.test(prediction) && !/battery/i.test(prediction)) return "AMBIGUOUS — COIN-LEANING";
    return "AMBIGUOUS — BATTERY-LIKE PATTERN";
  }
  if (/battery/i.test(prediction)) return "BATTERY-LIKE PATTERN";
  if (/coin/i.test(prediction)) return "COIN-LIKE PATTERN";
  return "NO DISC PATTERN";
}

function labelResearch(data: Record<string, unknown>, source: "live" | "prerecorded_research_demo") {
  const prediction = String(data.prediction || "");
  const ambiguous = Boolean(data.ambiguous || data.stacked_mimic);
  const protocol = ((data.protocol || {}) as Record<string, unknown>);
  const label = String(protocol.research_label || researchLabel(prediction, ambiguous));
  data.inference_source = data.inference_source || source;
  data.scores_are_calibrated_probabilities = false;
  data.clinical_use = "not_a_diagnosis";
  protocol.research_label = label;
  protocol.urgency = label;
  protocol.uncertainty = protocol.uncertainty || (ambiguous ? "high" : "moderate");
  protocol.safety = SAFETY;
  protocol.time_window = "Research readout only. Not a treatment timeline and not a disposition.";
  protocol.actions = [
    "Scores are uncalibrated outputs of an experimental model trained on synthetic discs.",
    "A coin-like or no-disc result does not rule out a button battery.",
    "An ambiguity flag is not an order for endoscopy, surgery, or discharge.",
  ];
  protocol.contacts = [
    "If ingestion is suspected, call emergency services or go to an emergency department. Do not wait for this app.",
    "National Battery Ingestion Hotline (National Capital Poison Center): 1-800-498-8666",
    "Poison Help Line: 1-800-222-1222",
  ];
  protocol.reese_law_note =
    "Reese's Law (Public Law 117-171) requires safer packaging and battery compartments. It does not validate diagnostic software.";
  data.protocol = protocol;
  if (data.inference_source !== "live") {
    data.synthetic_label =
      "Prerecorded synthetic demonstration from the bundled model. Not a new forward pass and not a patient image.";
  }
  return data;
}

async function readJson(parts: string[]): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "public", ...parts), "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchBackend(req: NextRequest, joined: string): Promise<Response | null> {
  if (!BACKEND) return null;
  const url = new URL(`${BACKEND}/api/${joined}${req.nextUrl.search}`);
  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const init: RequestInit = { method: req.method, headers, cache: "no-store" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(50000) });
  } catch {
    return null;
  }
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const joined = pathParts.join("/");

  if (req.method === "GET" && joined === "health") {
    const live = await fetchBackend(req, joined);
    if (live?.ok) {
      return NextResponse.json(await live.json());
    }
    return NextResponse.json({
      status: "unavailable",
      model: false,
      version: null,
      detail: "Inference API is not responding. Prerecorded synthetic demos are still available and are labeled as such.",
    });
  }

  if (req.method === "GET" && pathParts[0] === "demo" && pathParts.length === 2 && DEMO_CASES.has(pathParts[1])) {
    const live = await fetchBackend(req, joined);
    if (live?.ok) {
      const data = (await live.json()) as Record<string, unknown>;
      return NextResponse.json(labelResearch(data, "live"));
    }
    const cached = await readJson(["demos", `${pathParts[1]}.json`]);
    if (cached) {
      return NextResponse.json(labelResearch(cached, "prerecorded_research_demo"));
    }
  }

  if (req.method === "GET" && joined === "metrics") {
    const published = await readJson(["figures", "validation", "eval_report.json"]);
    if (published) {
      published.metrics_source = "published_synthetic_report";
      return NextResponse.json(published);
    }
    const legacy = await readJson(["figures", "validation", "metrics.json"]);
    if (legacy) {
      legacy.metrics_source = "legacy_synthetic_point_estimates";
      legacy.clinical_accuracy = false;
      legacy.comparison_note =
        "These figures are synthetic point estimates. They are not a clinical comparison with the Emory 2020 study.";
      return NextResponse.json(legacy);
    }
  }

  if (!BACKEND) {
    return NextResponse.json(
      {
        error: "The inference API is unavailable. Prerecorded demos can still be opened from the scanner. Uploaded images are not analyzed while the API is down.",
      },
      { status: 503 },
    );
  }

  const live = await fetchBackend(req, joined);
  if (!live) {
    return NextResponse.json(
      { error: "The inference API did not respond. No analysis was invented in its place." },
      { status: 503 },
    );
  }

  if (req.method === "POST" && joined === "analyze" && live.ok) {
    const data = (await live.json()) as Record<string, unknown>;
    return NextResponse.json(labelResearch(data, "live"));
  }

  const outHeaders = new Headers();
  const resCt = live.headers.get("content-type");
  if (resCt) outHeaders.set("content-type", resCt);
  const disp = live.headers.get("content-disposition");
  if (disp) outHeaders.set("content-disposition", disp);
  return new NextResponse(live.body, { status: live.status, headers: outHeaders });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await ctx.params;
  return proxy(req, pathParts);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: pathParts } = await ctx.params;
  return proxy(req, pathParts);
}

export const runtime = "nodejs";
export const maxDuration = 60;

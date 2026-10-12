from __future__ import annotations

import io
import json
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, Request, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

Image.MAX_IMAGE_PIXELS = 16_000_000
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
MAX_EDGE = 1024
ALLOWED_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "application/octet-stream",
}
_HITS: dict[str, deque] = defaultdict(deque)

from haloscan.inference import get_engine
from haloscan.report import generate_html_report
from haloscan.synthetic import generate_sample
from haloscan.visualize import numpy_to_b64

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
METRICS_FILE = ROOT / "weights" / "metrics.json"
EVAL_REPORT_FILE = ROOT / "docs" / "eval" / "eval_report.json"

_metrics_cache: dict | None = None
_metrics_cache_time: float = 0
METRICS_TTL = 3600
API_VERSION = "2.5.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_engine()
    yield


app = FastAPI(
    title="Haloscan API",
    version=API_VERSION,
    description="Experimental research prototype. Not a medical device.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://haloscan-cac.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:7860",
        "http://127.0.0.1:7860",
    ],
    allow_origin_regex=r"https://haloscan[a-z0-9-]*\.vercel\.app",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:80] or "unknown"
    if request.client:
        return request.client.host
    return "unknown"


def _limit(request: Request, bucket: str, limit: int = 30, window: float = 60.0) -> None:
    now = time.time()
    key = f"{bucket}:{_client_key(request)}"
    hits = _HITS[key]
    while hits and now - hits[0] > window:
        hits.popleft()
    if len(hits) >= limit:
        raise HTTPException(429, "Too many requests. Wait a minute and try again.")
    hits.append(now)


def decode_image_bytes(data: bytes, content_type: str | None) -> np.ndarray:
    if content_type and content_type.split(";")[0].strip().lower() not in ALLOWED_TYPES:
        raise HTTPException(415, "Upload a PNG, JPEG, or WebP image.")
    if not data:
        raise HTTPException(400, "Empty upload.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Image too large (max 8 MB).")
    try:
        probe = Image.open(io.BytesIO(data))
        probe.verify()
        img = Image.open(io.BytesIO(data))
        img = img.convert("RGB")
        if max(img.size) > MAX_EDGE:
            img.thumbnail((MAX_EDGE, MAX_EDGE))
        return np.array(img)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(400, "Could not read that file as an image.") from exc


def _read_upload(f: UploadFile | None) -> np.ndarray | None:
    if f is None:
        return None
    data = f.file.read(MAX_UPLOAD_BYTES + 1)
    if not data:
        return None
    return decode_image_bytes(data, f.content_type)


def _public_result(result, *, source: str, synthetic: bool) -> dict:
    payload = result.to_dict()
    payload["inference_source"] = source
    payload["synthetic_demo"] = synthetic
    payload["scores_are_calibrated_probabilities"] = False
    payload["clinical_use"] = "not_a_diagnosis"
    return payload


def _safe_analyze(ap_img, lat_img):
    try:
        return get_engine().analyze(ap_img, lat_img)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "Analysis failed. The image could not be processed.")


def _demo_spec(case: str) -> tuple[int, bool]:
    # Coin demos include a synthetic lateral so judges can see the dual-view
    # collapse guard (DualViewNet alone still fails; ensemble recovers).
    mapping = {
        "battery": (0, True),
        "coin": (1, True),
        "stacked": (2, False),
        "normal": (3, False),
    }
    if case not in mapping:
        raise HTTPException(404, f"Unknown case: {case}. Try: battery, coin, stacked, normal")
    return mapping[case]


def _gray_to_b64(gray: np.ndarray) -> str:
    rgb = cv2.cvtColor((gray * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
    return numpy_to_b64(rgb)


def _run_demo(case: str):
    label, with_lat = _demo_spec(case)
    ap = generate_sample(label, seed=42)
    ap_rgb = cv2.cvtColor((ap * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
    lat_rgb = None
    if with_lat and label in (0, 1):
        lat = generate_sample(label, lateral=True, seed=43)
        lat_rgb = cv2.cvtColor((lat * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
    return get_engine().analyze(ap_rgb, lat_rgb)


def _bundled_metrics() -> dict | None:
    """Prefer the versioned eval report. Never recompute on the request path."""
    if EVAL_REPORT_FILE.exists():
        report = json.loads(EVAL_REPORT_FILE.read_text())
        report["metrics_source"] = "published_synthetic_eval_report"
        report["clinical_accuracy"] = False
        return report
    if METRICS_FILE.exists():
        legacy = json.loads(METRICS_FILE.read_text())
        legacy["metrics_source"] = "legacy_synthetic_point_estimates"
        legacy["clinical_accuracy"] = False
        return legacy
    return None


@app.get("/judge")
async def judge_guide():
    judge = STATIC / "judge.html"
    if judge.exists():
        return FileResponse(judge)
    raise HTTPException(404)


@app.get("/")
async def root():
    index = STATIC / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse({"service": "Haloscan API", "docs": "/docs"})


@app.post("/api/analyze")
async def analyze(
    request: Request,
    ap: UploadFile = File(...),
    lateral: UploadFile | None = File(None),
):
    _limit(request, "analyze", limit=20)
    ap_img = _read_upload(ap)
    if ap_img is None:
        raise HTTPException(400, "AP image required")
    lat_img = _read_upload(lateral)
    return _public_result(_safe_analyze(ap_img, lat_img), source="live", synthetic=False)


@app.post("/api/report")
async def report(
    request: Request,
    ap: UploadFile = File(...),
    lateral: UploadFile | None = File(None),
):
    _limit(request, "report", limit=10)
    ap_img = _read_upload(ap)
    if ap_img is None:
        raise HTTPException(400, "AP image required")
    lat_img = _read_upload(lateral)
    result = _safe_analyze(ap_img, lat_img)
    html = generate_html_report(result)
    return HTMLResponse(html, headers={"Content-Disposition": "attachment; filename=haloscan-report.html"})


@app.get("/api/demo/{case}")
async def demo(request: Request, case: str):
    _limit(request, "demo", limit=40)
    try:
        result = _run_demo(case)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "Demo inference failed.")
    payload = _public_result(result, source="live", synthetic=True)
    payload["synthetic_label"] = (
        "Procedural synthetic radiograph. Not a patient image and not a new clinical study."
    )
    return payload


@app.get("/api/demo/{case}/previews")
async def demo_previews(case: str):
    label, with_lat = _demo_spec(case)
    ap = generate_sample(label, seed=42)
    out = {"ap_b64": _gray_to_b64(ap), "lateral_b64": None}
    if with_lat and label == 0:
        lat = generate_sample(0, lateral=True, seed=43)
        out["lateral_b64"] = _gray_to_b64(lat)
    return out


@app.get("/api/demo/{case}/report")
async def demo_report(case: str):
    result = _run_demo(case)
    return HTMLResponse(
        generate_html_report(result),
        headers={"Content-Disposition": f"attachment; filename=haloscan-{case}-report.html"},
    )


@app.get("/api/cases")
async def cases():
    return [
        {
            "id": "battery",
            "title": "Button battery",
            "subtitle": "AP + lateral",
            "description": "Synthetic double halo with a separate synthetic lateral. Research example only.",
            "urgency": "battery-like",
            "shortcut": "1",
        },
        {
            "id": "coin",
            "title": "Single coin",
            "subtitle": "AP only",
            "description": "Synthetic flat disc. A coin-like score does not rule out a battery.",
            "urgency": "coin-like",
            "shortcut": "2",
        },
        {
            "id": "stacked",
            "title": "Stacked coins",
            "subtitle": "Hard case",
            "description": "Synthetic stacked coins that copy the halo. Ambiguity is a research flag, not a treatment order.",
            "urgency": "ambiguous",
            "shortcut": "3",
        },
        {
            "id": "normal",
            "title": "Normal study",
            "subtitle": "No foreign body",
            "description": "Synthetic background with no disc. Not a negative clinical study.",
            "urgency": "no-disc",
            "shortcut": "4",
        },
    ]


@app.get("/api/metrics")
async def metrics(refresh: bool = False):
    """Serve the published synthetic report only.

    Running evaluate_on_synthetic on a web request previously exhausted the
    free Render worker and returned HTTP 503. Recompute offline with:

        python3 -m haloscan.eval_suite --n 40
    """
    global _metrics_cache, _metrics_cache_time
    now = time.time()
    if not refresh and _metrics_cache and (now - _metrics_cache_time) < METRICS_TTL:
        return _metrics_cache
    bundled = _bundled_metrics()
    if bundled:
        _metrics_cache = bundled
        _metrics_cache_time = now
        return bundled
    raise HTTPException(
        503,
        "Published metrics are not bundled on this host. "
        "Run `python3 -m haloscan.eval_suite --n 40` offline; live recomputation is disabled.",
    )


@app.get("/api/health")
async def health():
    bundled = _bundled_metrics()
    engine_ok = False
    try:
        engine_ok = get_engine() is not None
    except Exception:
        engine_ok = False
    return {
        "status": "ok" if engine_ok else "degraded",
        "version": API_VERSION,
        "model": "loaded" if engine_ok else "failed",
        "positioning": "experimental_research_prototype",
        "weights": "bundled" if (ROOT / "weights" / "haloscan.pt").exists() else "custom",
        "metrics": bundled is not None,
        "metrics_path": "docs/eval/eval_report.json" if EVAL_REPORT_FILE.exists() else "weights/metrics.json",
    }


if STATIC.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")

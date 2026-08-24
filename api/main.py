from __future__ import annotations

import io
import json
import time
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image

from haloscan.evaluate import evaluate_on_synthetic
from haloscan.inference import get_engine
from haloscan.report import generate_html_report
from haloscan.synthetic import generate_sample
from haloscan.visualize import numpy_to_b64

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
METRICS_FILE = ROOT / "weights" / "metrics.json"

_metrics_cache: dict | None = None
_metrics_cache_time: float = 0
METRICS_TTL = 3600


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_engine()
    yield


app = FastAPI(title="Haloscan API", version="2.3.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _read_upload(f: UploadFile | None) -> np.ndarray | None:
    if f is None:
        return None
    data = f.file.read()
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(413, "Image too large (max 20 MB)")
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return np.array(img)


def _demo_spec(case: str) -> tuple[int, bool]:
    mapping = {
        "battery": (0, True),
        "coin": (1, False),
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
    if with_lat and label == 0:
        lat = generate_sample(0, lateral=True, seed=43)
        lat_rgb = cv2.cvtColor((lat * 255).astype(np.uint8), cv2.COLOR_GRAY2RGB)
    return get_engine().analyze(ap_rgb, lat_rgb)


def _bundled_metrics() -> dict | None:
    if METRICS_FILE.exists():
        return json.loads(METRICS_FILE.read_text())
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
    ap: UploadFile = File(...),
    lateral: UploadFile | None = File(None),
):
    ap_img = _read_upload(ap)
    if ap_img is None:
        raise HTTPException(400, "AP image required")
    lat_img = _read_upload(lateral)
    result = get_engine().analyze(ap_img, lat_img)
    return result.to_dict()


@app.post("/api/report")
async def report(
    ap: UploadFile = File(...),
    lateral: UploadFile | None = File(None),
):
    ap_img = _read_upload(ap)
    if ap_img is None:
        raise HTTPException(400, "AP image required")
    lat_img = _read_upload(lateral)
    result = get_engine().analyze(ap_img, lat_img)
    html = generate_html_report(result)
    return HTMLResponse(html, headers={"Content-Disposition": "attachment; filename=haloscan-report.html"})


@app.get("/api/demo/{case}")
async def demo(case: str):
    return _run_demo(case).to_dict()


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
            "description": "Classic double halo with lateral step-off morphology",
            "urgency": "critical",
            "shortcut": "1",
        },
        {
            "id": "coin",
            "title": "Single coin",
            "subtitle": "AP only",
            "description": "Homogeneous disc density without step-off",
            "urgency": "routine",
            "shortcut": "2",
        },
        {
            "id": "stacked",
            "title": "Stacked coins",
            "subtitle": "Hard case",
            "description": "False double halo — must still trigger emergency protocol",
            "urgency": "critical",
            "shortcut": "3",
        },
        {
            "id": "normal",
            "title": "Normal study",
            "subtitle": "No foreign body",
            "description": "Negative pediatric chest radiograph",
            "urgency": "routine",
            "shortcut": "4",
        },
    ]


@app.get("/api/metrics")
async def metrics(refresh: bool = False):
    global _metrics_cache, _metrics_cache_time
    now = time.time()
    if not refresh and _metrics_cache and (now - _metrics_cache_time) < METRICS_TTL:
        return _metrics_cache
    if not refresh:
        bundled = _bundled_metrics()
        if bundled:
            _metrics_cache = bundled
            _metrics_cache_time = now
            return bundled
    _metrics_cache = evaluate_on_synthetic(n=40)
    _metrics_cache_time = now
    return _metrics_cache


@app.get("/api/health")
async def health():
    bundled = _bundled_metrics()
    return {
        "status": "ok",
        "version": "2.3.0",
        "model": "loaded",
        "weights": "bundled" if (ROOT / "weights" / "haloscan.pt").exists() else "custom",
        "metrics": bundled is not None,
    }


if STATIC.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC)), name="static")

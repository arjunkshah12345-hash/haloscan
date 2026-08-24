from __future__ import annotations

from dataclasses import dataclass, asdict

from haloscan.clinical import ClinicalProtocol
from haloscan.halo_analyzer import HaloAnalysis


@dataclass
class HaloscanResult:
    prediction: str
    confidence: float
    battery_probability: float
    coin_probability: float
    ambiguous: bool
    emergency: bool
    ap_halo: HaloAnalysis
    lat_halo: HaloAnalysis | None
    explanation: str
    model_probs: dict[str, float]
    cv_probs: dict[str, float]
    protocol: ClinicalProtocol
    radial_chart_b64: str
    overlay_b64: str
    gradcam_b64: str
    dual_view_used: bool
    inference_ms: float = 0.0
    stacked_mimic: bool = False

    def to_dict(self) -> dict:
        d = asdict(self)
        d["ap_halo"] = asdict(self.ap_halo)
        d["lat_halo"] = asdict(self.lat_halo) if self.lat_halo else None
        d["protocol"] = asdict(self.protocol)
        return d

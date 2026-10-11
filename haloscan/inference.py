from __future__ import annotations

import time

import torch
import torch.nn.functional as F

from haloscan.clinical import build_protocol
from haloscan.gradcam import compute_gradcam, overlay_gradcam
from haloscan.halo_analyzer import analyze_halo, draw_overlay
from haloscan.models import CLASS_NAMES
from haloscan.preprocess import enhance_xray, load_image, to_rgb_tensor
from haloscan.result import HaloscanResult
from haloscan.visualize import numpy_to_b64, radial_profile_chart
from haloscan.weights import load_trained_models


class HaloscanEngine:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.single, self.dual = load_trained_models(self.device)

    @torch.inference_mode()
    def _model_probs(self, ap_gray, lat_gray=None) -> dict[str, float]:
        ap_rgb = to_rgb_tensor(enhance_xray(ap_gray))
        ap_t = torch.from_numpy(ap_rgb).permute(2, 0, 1).unsqueeze(0).to(self.device)

        if lat_gray is not None and self.dual is not None:
            lat_rgb = to_rgb_tensor(enhance_xray(lat_gray))
            lat_t = torch.from_numpy(lat_rgb).permute(2, 0, 1).unsqueeze(0).to(self.device)
            logits = self.dual(ap_t, lat_t)
        else:
            logits = self.single(ap_t)

        probs = F.softmax(logits, dim=1)[0].cpu().numpy()
        return {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))}

    def analyze(
        self,
        ap_image,
        lateral_image=None,
        *,
        mode: str = "ensemble",
        explain: bool = True,
    ) -> HaloscanResult:
        """Run the pipeline.

        mode:
          ensemble — CV + CNN fusion and ambiguity rules (default)
          cnn — softmax only
          cv — classical scores only
          no_ambiguity — fusion without the ambiguity / stacked-mimic overrides
        explain=False skips Grad-CAM and charts for batch evaluation.
        """
        t0 = time.perf_counter()
        ap_gray = enhance_xray(load_image(ap_image))
        ap_halo = analyze_halo(ap_gray, view="ap")

        lat_gray = lat_halo = None
        if lateral_image is not None:
            lat_gray = enhance_xray(load_image(lateral_image))
            lat_halo = analyze_halo(lat_gray, view="lateral")

        model_p = self._model_probs(ap_gray, lat_gray)
        dual_used = lat_gray is not None

        cv_battery = ap_halo.battery_score
        cv_coin = ap_halo.coin_score
        if lat_halo is not None:
            cv_battery = 0.40 * ap_halo.battery_score + 0.60 * lat_halo.battery_score
            cv_coin = 0.40 * ap_halo.coin_score + 0.60 * lat_halo.coin_score

        cv_normal = max(0.0, 1.0 - cv_battery - cv_coin)
        cnn_battery = model_p.get("battery", 0.0)
        cnn_coin = model_p.get("coin", 0.0)

        # Ensemble weights are the implementation, not a calibrated probability.
        bat = 0.48 * cv_battery + 0.42 * cnn_battery + 0.10 * (1 - cnn_coin)
        coin = 0.48 * cv_coin + 0.52 * cnn_coin
        if dual_used and lat_halo is not None and lat_halo.stepoff_score > 0.35:
            bat += 0.06

        if mode == "cnn":
            bat, coin = cnn_battery, cnn_coin
        elif mode == "cv":
            bat, coin = cv_battery, cv_coin

        total = bat + coin + 1e-6
        bat_n, coin_n = bat / total, coin / total

        ambiguous = ap_halo.halo_score > 0.42 and (
            lat_halo is None or lat_halo.stepoff_score < 0.38
        )

        strong_coin = coin_n >= 0.58 and ap_halo.halo_score < 0.35 and (
            cnn_coin >= 0.40 or ap_halo.halo_score < 0.22
        )

        stacked_mimic = (
            ap_halo.stacked_mimic_score >= 0.42
            or (
                ap_halo.center is not None
                and ap_halo.halo_score >= 0.35
                and ap_halo.profile_peaks >= 2
                and (lat_halo is None or lat_halo.stepoff_score < 0.35)
            )
        )
        if strong_coin:
            stacked_mimic = False
            ambiguous = False

        ap_only_disc = (
            ap_halo.center is not None
            and lat_gray is None
            and ap_halo.halo_score >= 0.40
            and not strong_coin
        )
        if stacked_mimic or ap_only_disc:
            ambiguous = True

        # Ablations measure the branch itself. They do not apply the
        # ambiguity rewrite. `stacked_mimic` on the result stays the CV measurement.
        if mode in {"cnn", "cv", "no_ambiguity"}:
            ambiguous = False
            stacked_flag = False
        else:
            stacked_flag = stacked_mimic

        if bat_n >= coin_n:
            prediction, confidence = "BATTERY-LIKE", bat_n
        else:
            prediction, confidence = "COIN-LIKE", coin_n

        if mode == "ensemble" and ambiguous and not strong_coin and (
            bat_n > 0.28 or stacked_flag or ap_only_disc
        ):
            prediction = "AMBIGUOUS — BATTERY-LIKE PATTERN"
            # Do not inflate the score. Ambiguity is reported separately.

        components_agree = (cv_battery >= cv_coin) == (cnn_battery >= cnn_coin)
        research_flag = (
            bat_n >= 0.48
            or (mode == "ensemble" and ambiguous and not strong_coin)
            or (prediction.startswith("BATTERY") and not strong_coin and mode == "ensemble")
            or (mode == "cnn" and cnn_battery >= max(cnn_coin, model_p.get("normal", 0.0)))
            or (mode == "cv" and cv_battery >= cv_coin and cv_battery >= 0.45)
            or (mode == "no_ambiguity" and bat_n >= 0.48)
        )
        # `emergency` is the historical field name. It means the research flag
        # fired. It is not a clinical order.
        emergency = bool(research_flag)

        explanation = ap_halo.explanation
        if lat_halo is not None and lat_halo.stepoff_score > 0.42:
            explanation += " Lateral step-off score is high on this synthetic lateral."
        elif lat_halo is not None and lat_halo.stepoff_score < 0.22 and ap_halo.halo_score > 0.38:
            explanation += " AP halo without a high lateral step-off — stacked coins remain in the differential."
        elif stacked_flag:
            explanation += (
                f" Stacked-coin mimic score is elevated (AP peaks={ap_halo.profile_peaks}, "
                f"mimic={ap_halo.stacked_mimic_score:.2f}). This is a research flag, not a treatment order."
            )
        explanation += " Scores are uncalibrated and come from an experimental model."

        no_disc = ap_halo.center is None and ap_halo.halo_score < 0.15 and cv_battery < 0.25 and not stacked_flag
        protocol = build_protocol(
            bat_n,
            ambiguous if mode == "ensemble" else False,
            dual_used,
            coin_prob=coin_n,
            no_disc=no_disc,
            stacked=stacked_flag,
            components_agree=components_agree,
        )
        if explain:
            overlay = draw_overlay(ap_gray, ap_halo, "BATTERY" if prediction.startswith("BATTERY") or prediction.startswith("AMBIGUOUS") else "COIN")
            ap_rgb = to_rgb_tensor(ap_gray)
            ap_t = torch.from_numpy(ap_rgb).permute(2, 0, 1).unsqueeze(0).float()
            model = self.dual if dual_used and self.dual else self.single
            cam = compute_gradcam(model, ap_t, target_class=0, device=self.device)
            gradcam = overlay_gradcam(ap_gray, cam)
            overlay_b64 = numpy_to_b64(overlay)
            gradcam_b64 = numpy_to_b64(gradcam)
            radial_b64 = radial_profile_chart(ap_halo.radial_profile, ap_halo.halo_score)
        else:
            overlay_b64 = ""
            gradcam_b64 = ""
            radial_b64 = ""

        elapsed_ms = (time.perf_counter() - t0) * 1000

        return HaloscanResult(
            prediction=prediction,
            confidence=float(confidence),
            battery_probability=float(bat_n),
            coin_probability=float(coin_n),
            ambiguous=ambiguous,
            emergency=emergency,
            ap_halo=ap_halo,
            lat_halo=lat_halo,
            explanation=explanation,
            model_probs=model_p,
            cv_probs={"battery": cv_battery, "coin": cv_coin, "normal": cv_normal},
            protocol=protocol,
            radial_chart_b64=radial_b64,
            overlay_b64=overlay_b64,
            gradcam_b64=gradcam_b64,
            dual_view_used=dual_used,
            inference_ms=elapsed_ms,
            stacked_mimic=stacked_mimic,
        )


_engine: HaloscanEngine | None = None


def get_engine() -> HaloscanEngine:
    global _engine
    if _engine is None:
        _engine = HaloscanEngine()
    return _engine

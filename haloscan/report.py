from __future__ import annotations

from datetime import datetime, timezone

from haloscan.result import HaloscanResult


def generate_html_report(result: HaloscanResult) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    p = result.protocol
    actions = "".join(f"<li>{a}</li>" for a in p.actions)
    contacts = "".join(f"<li>{c}</li>" for c in p.contacts)
    urgency_color = p.color
    emergency_tag = " · ⚠️ AMBIGUOUS HALO" if result.ambiguous else ""
    lat_step = result.lat_halo.stepoff_score if result.lat_halo else result.ap_halo.stepoff_score

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Haloscan Report — {result.prediction}</title>
  <style>
    :root {{ --red: #dc2626; --muted: #64748b; --border: #e2e8f0; }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: "Georgia", "Times New Roman", serif;
      max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem;
      color: #0f172a; line-height: 1.65; background: #f8fafc;
    }}
    .header {{
      border-bottom: 3px solid var(--red);
      padding-bottom: 1rem; margin-bottom: 1.5rem;
    }}
    .header h1 {{ font-size: 1.75rem; font-weight: 400; letter-spacing: -0.02em; }}
    .meta {{ color: var(--muted); font-size: 0.85rem; margin-top: 0.35rem; }}
    .verdict {{
      background: #fef2f2; border-left: 5px solid {urgency_color};
      padding: 1.25rem; margin: 1.25rem 0; border-radius: 0 8px 8px 0;
    }}
    .verdict-title {{ font-size: 1.35rem; font-weight: 700; color: #1e293b; }}
    .verdict-meta {{ font-size: 0.9rem; color: var(--muted); margin-top: 0.35rem; }}
    table {{ width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.9rem; }}
    td, th {{ border: 1px solid var(--border); padding: 0.6rem 0.75rem; text-align: left; }}
    th {{ background: #f1f5f9; font-weight: 600; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.25rem 0; }}
    @media (max-width: 600px) {{ .grid {{ grid-template-columns: 1fr; }} }}
    img {{ max-width: 100%; border: 1px solid var(--border); border-radius: 6px; background: #000; }}
    figcaption {{ font-size: 0.75rem; color: var(--muted); margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.05em; }}
    .protocol {{
      background: white; padding: 1.25rem; border-radius: 10px;
      border: 1px solid var(--border); margin: 1.5rem 0;
    }}
    .protocol h2 {{ color: {urgency_color}; font-size: 1.1rem; margin-bottom: 0.5rem; }}
    .protocol ul {{ padding-left: 1.25rem; margin: 0.75rem 0; }}
    .protocol li {{ margin: 0.35rem 0; }}
    .reese {{
      font-style: italic; font-size: 0.9rem; color: #475569;
      border-left: 3px solid var(--red); padding-left: 1rem; margin-top: 1rem;
    }}
    .disclaimer {{
      font-size: 0.8rem; color: var(--muted); margin-top: 2rem;
      border-top: 1px solid var(--border); padding-top: 1rem;
    }}
    .ensemble {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 1rem 0; }}
    .ensemble div {{ background: #f1f5f9; padding: 0.75rem; border-radius: 6px; text-align: center; }}
    .ensemble strong {{ display: block; font-size: 1.25rem; color: #1e293b; }}
    .ensemble span {{ font-size: 0.75rem; color: var(--muted); }}
  </style>
</head>
<body>
  <div class="header">
    <h1>Haloscan Analysis Report</h1>
    <p class="meta">Generated {ts} · Inference {result.inference_ms:.0f} ms · Decision support only — not a medical device</p>
  </div>

  <div class="verdict">
    <div class="verdict-title">{result.prediction}</div>
    <p class="verdict-meta">
      Confidence: {result.confidence:.1%} · Battery: {result.battery_probability:.1%} · Coin: {result.coin_probability:.1%}{emergency_tag}
    </p>
  </div>

  <div class="ensemble">
    <div><strong>{result.cv_probs.get("battery", 0):.0%}</strong><span>CV battery score</span></div>
    <div><strong>{result.model_probs.get("battery", 0):.0%}</strong><span>CNN battery score</span></div>
    <div><strong>{result.battery_probability:.0%}</strong><span>Fused output</span></div>
  </div>

  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Halo score (AP)</td><td>{result.ap_halo.halo_score:.3f}</td></tr>
    <tr><td>Radial peaks (AP)</td><td>{result.ap_halo.profile_peaks}</td></tr>
    <tr><td>Stacked-coin mimic score</td><td>{result.ap_halo.stacked_mimic_score:.3f}</td></tr>
    <tr><td>Step-off score</td><td>{lat_step:.3f}</td></tr>
    <tr><td>Dual-view fusion</td><td>{"Yes" if result.dual_view_used else "No"}</td></tr>
    <tr><td>Emergency flag</td><td>{"Yes" if result.emergency else "No"}</td></tr>
  </table>

  <p><strong>Interpretation:</strong> {result.explanation}</p>

  <div class="grid">
    <figure><figcaption>Detection overlay</figcaption><img src="{result.overlay_b64}" alt="Overlay"/></figure>
    <figure><figcaption>Grad-CAM</figcaption><img src="{result.gradcam_b64}" alt="Grad-CAM"/></figure>
  </div>
  <figure><figcaption>Radial halo profile</figcaption><img src="{result.radial_chart_b64}" alt="Radial profile" style="max-width:480px"/></figure>

  <div class="protocol">
    <h2>{p.urgency} — Clinical Protocol</h2>
    <p><em>{p.time_window}</em></p>
    <ul>{actions}</ul>
    <p><strong>Contacts:</strong></p>
    <ul>{contacts}</ul>
    <p class="reese">{p.reese_law_note}</p>
  </div>

  <p class="disclaimer">
    Haloscan is research decision support tied to Reese's Law (P.L. 117-171) diagnostic gap analysis.
    This report does not constitute medical advice. Suspected button battery ingestion requires immediate emergency care.<br/>
    Poison Control: 1-800-222-1222 · National Battery Ingestion Hotline: 202-625-3333
  </p>
</body>
</html>"""

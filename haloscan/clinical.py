"""Research readout for an experimental prototype.

This module used to emit CRITICAL / URGENT / ROUTINE care pathways.
Those labels are gone. HaloScan must not recommend discharge, rule out a
battery, or give individualized treatment orders.
"""

from __future__ import annotations

from dataclasses import dataclass


SAFETY_STATEMENT = (
    "Suspected button-battery ingestion requires immediate professional emergency "
    "evaluation regardless of this prototype's output. HaloScan does not diagnose, "
    "rule out a battery, recommend discharge, or replace emergency care."
)

PUBLIC_CONTACTS = [
    "If ingestion is suspected, call emergency services or go to an emergency department. Do not wait for this app.",
    "National Battery Ingestion Hotline (National Capital Poison Center): 1-800-498-8666",
    "Poison Help Line: 1-800-222-1222",
]

REESE_LAW_NOTE = (
    "Reese's Law (Public Law 117-171, 15 U.S.C. § 2056e, enacted August 16, 2022) "
    "directs the Consumer Product Safety Commission to require child-resistant "
    "packaging, warning labels, and safer battery compartments. It is a prevention "
    "statute. It does not authorize or validate diagnostic software. "
    "Source: https://www.congress.gov/bill/117th-congress/house-bill/5313"
)

# National Capital Poison Center, https://www.poison.org/battery (verified 2026-10-11).
HOTLINE = "1-800-498-8666"
POISON_HELP = "1-800-222-1222"


@dataclass
class ClinicalProtocol:
    """Kept name so existing imports still load. Content is a research readout."""

    urgency: str
    color: str
    time_window: str
    actions: list[str]
    contacts: list[str]
    reese_law_note: str
    research_label: str = ""
    uncertainty: str = "unspecified"
    safety: str = SAFETY_STATEMENT


def _uncertainty(battery_prob: float, coin_prob: float, ambiguous: bool, agree: bool) -> str:
    gap = abs(battery_prob - coin_prob)
    if ambiguous or not agree or gap < 0.12:
        return "high"
    if gap < 0.28:
        return "moderate"
    return "low"


def build_protocol(
    battery_prob: float,
    ambiguous: bool,
    has_lateral: bool,
    coin_prob: float = 0.0,
    no_disc: bool = False,
    stacked: bool = False,
    components_agree: bool = True,
) -> ClinicalProtocol:
    uncertainty = _uncertainty(battery_prob, coin_prob, ambiguous or stacked, components_agree)

    if no_disc and not ambiguous and not stacked:
        label = "NO DISC PATTERN"
        color = "#57534e"
        notes = [
            "The classical detector did not find a confident radiopaque disc.",
            "A missing disc on a synthetic or low-quality image is not a negative clinical study.",
        ]
    elif ambiguous or stacked:
        label = "AMBIGUOUS PATTERN"
        color = "#92400e"
        notes = [
            "The radial profile is unresolved between a button-battery halo and a stacked-coin mimic.",
            "Ambiguity is a research flag. It is not a treatment order.",
            "Component scores below are uncalibrated. They are not a clinical probability.",
        ]
    elif battery_prob >= coin_prob:
        label = "BATTERY-LIKE PATTERN"
        color = "#9a3412"
        notes = [
            "The ensemble score leans toward the button-battery class on this image.",
            "This is a pattern match from a model trained on synthetic discs, not a diagnosis.",
            "Component scores are uncalibrated. They are not a clinical probability.",
        ]
    else:
        label = "COIN-LIKE PATTERN"
        color = "#44403c"
        notes = [
            "The ensemble score leans toward the coin class on this image.",
            "A coin-like score does not rule out a button battery and must not be used to send a child home.",
            "Component scores are uncalibrated. They are not a clinical probability.",
        ]

    if not has_lateral:
        notes.append("No lateral image was supplied, so the dual-view branch did not see a second projection.")
    else:
        notes.append("A lateral image was fused by the dual-view network. The two views are not a calibrated clinical pair.")

    if uncertainty == "high":
        notes.append("Uncertainty is high: the branches disagree, the margin is small, or the halo rule fired.")
    elif uncertainty == "moderate":
        notes.append("Uncertainty is moderate: the margin between classes is limited.")
    else:
        notes.append("Uncertainty is lower on this synthetic-style score, and still not a calibrated probability.")

    return ClinicalProtocol(
        urgency=label,
        color=color,
        time_window="Research readout only. Not a treatment timeline and not a disposition.",
        actions=notes,
        contacts=list(PUBLIC_CONTACTS),
        reese_law_note=REESE_LAW_NOTE,
        research_label=label,
        uncertainty=uncertainty,
        safety=SAFETY_STATEMENT,
    )

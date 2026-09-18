from __future__ import annotations

import random
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from haloscan.models import CLASS_NAMES, HaloscanNet, DualViewNet
from haloscan.synthetic import LABEL_NAMES, augment, generate_sample


def _to_tensor(gray: np.ndarray, size: int = 224) -> torch.Tensor:
    resized = cv2.resize(gray, (size, size), interpolation=cv2.INTER_AREA)
    rgb = np.stack([resized, resized, resized], axis=0)
    return torch.from_numpy(rgb.astype(np.float32))


def build_dataset(
    n_per_class: int = 200,
    size: int = 224,
    dual: bool = True,
) -> tuple[torch.Tensor, torch.Tensor | None, torch.Tensor]:
    """Returns (ap_tensor, lat_tensor|None, labels). Label map: battery=0, coin=1, stacked→battery ambiguous=0, normal=2."""
    ap_list, lat_list, ys = [], [], []
    # Map synthetic labels to model classes: battery+stacked→0, coin→1, normal→2
    class_map = {0: 0, 1: 1, 2: 0, 3: 2}

    for syn_label in range(4):
        for i in range(n_per_class):
            lateral = syn_label in (0, 1) and dual and i % 2 == 0
            ap_gray = augment(generate_sample(syn_label, size=size + 48, lateral=False))
            ap_list.append(_to_tensor(ap_gray, size))
            ys.append(class_map[syn_label])
            if dual and lateral:
                lat_gray = augment(generate_sample(syn_label, size=size + 48, lateral=True))
                lat_list.append(_to_tensor(lat_gray, size))
            elif dual:
                lat_list.append(torch.zeros(3, size, size))

    ap_x = torch.stack(ap_list)
    y = torch.tensor(ys, dtype=torch.long)
    lat_x = torch.stack(lat_list) if dual else None
    return ap_x, lat_x, y


def train_models(
    epochs: int = 10,
    batch_size: int = 32,
    device: str | None = None,
) -> tuple[HaloscanNet, DualViewNet]:
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    ap_x, lat_x, y = build_dataset(dual=True)

    # Battery-weighted but not so aggressive that coin class collapses
    weights = torch.tensor([2.5, 1.4, 0.5], device=device)
    criterion = nn.CrossEntropyLoss(weight=weights)

    # Single-view model
    single = HaloscanNet().to(device)
    opt_s = torch.optim.AdamW(single.parameters(), lr=1.5e-3, weight_decay=1e-4)
    sched_s = torch.optim.lr_scheduler.CosineAnnealingLR(opt_s, T_max=max(1, epochs))
    ds = TensorDataset(ap_x, y)
    loader = DataLoader(ds, batch_size=batch_size, shuffle=True)

    single.train()
    for _ in range(epochs):
        for bx, by in loader:
            bx, by = bx.to(device), by.to(device)
            opt_s.zero_grad()
            loss = criterion(single(bx), by)
            loss.backward()
            opt_s.step()
        sched_s.step()
    single.eval()

    # Dual-view model
    dual = DualViewNet().to(device)
    opt_d = torch.optim.AdamW(dual.parameters(), lr=1.5e-3, weight_decay=1e-4)
    sched_d = torch.optim.lr_scheduler.CosineAnnealingLR(opt_d, T_max=max(1, epochs))
    assert lat_x is not None
    ds_d = TensorDataset(ap_x, lat_x, y)
    loader_d = DataLoader(ds_d, batch_size=batch_size, shuffle=True)

    dual.train()
    for _ in range(epochs):
        for bap, blat, by in loader_d:
            bap, blat, by = bap.to(device), blat.to(device), by.to(device)
            opt_d.zero_grad()
            loss = criterion(dual(bap, blat), by)
            loss.backward()
            opt_d.step()
        sched_d.step()
    dual.eval()

    return single, dual


def save_models(single: HaloscanNet, dual: DualViewNet, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "single": single.state_dict(),
            "dual": dual.state_dict(),
            "classes": CLASS_NAMES,
            "version": 2,
        },
        path,
    )


def load_models(path: str | Path, device: str | None = None) -> tuple[HaloscanNet, DualViewNet]:
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(path, map_location=device, weights_only=False)
    single = HaloscanNet().to(device)
    dual = DualViewNet().to(device)
    if "single" in ckpt:
        single.load_state_dict(ckpt["single"])
        dual.load_state_dict(ckpt["dual"])
    else:
        # v1 checkpoint compat
        single.load_state_dict(ckpt["state_dict"])
    single.eval()
    dual.eval()
    return single, dual


# Back-compat aliases used by older imports
train_quick = lambda device=None: train_models(device=device or ("cuda" if torch.cuda.is_available() else "cpu"))[0]
save_model = lambda model, path: save_models(model, DualViewNet(), path)
load_model = lambda path, device=None: load_models(path, device)[0]

"use client";

import { useEffect, useRef } from "react";

/** Ordered 4×4 Bayer threshold (0–15). */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

type Bar = { label: string; value: number; color: string };

const BARS: Bar[] = [
  { label: "Haloscan", value: 100, color: "#8b0000" },
  { label: "Emory 2020", value: 81, color: "#666666" },
  { label: "Stacked catch", value: 65, color: "#1a5c1a" },
];

function fillDitherRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rgb: [number, number, number],
  density: number,
) {
  const img = ctx.createImageData(Math.ceil(w), Math.ceil(h));
  const d = img.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const t = (BAYER[py % 4][px % 4] + 0.5) / 16;
      const on = density >= t;
      const i = (py * Math.ceil(w) + px) * 4;
      d[i] = rgb[0];
      d[i + 1] = rgb[1];
      d[i + 2] = rgb[2];
      d[i + 3] = on ? 220 : 0;
    }
  }
  ctx.putImageData(img, x, y);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function DitherBenchmark({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 320;
    const H = 200;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fafaf8";
    ctx.fillRect(0, 0, W, H);

    const maxBar = 120;
    const barW = 72;
    const gap = 28;
    const baseY = 160;
    const startX = (W - (BARS.length * barW + (BARS.length - 1) * gap)) / 2;

    BARS.forEach((bar, i) => {
      const bh = (bar.value / 100) * maxBar;
      const x = startX + i * (barW + gap);
      const y = baseY - bh;
      fillDitherRect(ctx, x, y, barW, bh, hexToRgb(bar.color), bar.value / 100);

      ctx.fillStyle = "#111";
      ctx.font = "700 13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(`${bar.value}%`, x + barW / 2, y - 8);

      ctx.fillStyle = "#555";
      ctx.font = "12px Georgia, serif";
      const lines = bar.label.split(" ");
      lines.forEach((line, li) => {
        ctx.fillText(line, x + barW / 2, baseY + 18 + li * 14);
      });
    });

    ctx.fillStyle = "#888";
    ctx.font = "italic 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Battery sensitivity · synthetic holdout", W / 2, H - 6);
  }, []);

  return (
    <canvas
      ref={ref}
      className={`dither-benchmark-canvas ${className}`.trim()}
      aria-label="Benchmark chart: Haloscan 100%, Emory 81%, stacked catch 65%"
      role="img"
    />
  );
}

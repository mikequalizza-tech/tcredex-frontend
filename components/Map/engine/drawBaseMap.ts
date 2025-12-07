// components/Map/engine/drawBaseMap.ts
import type { MapLayers } from "../MapContainer";

export function clearCanvas(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
}

export function drawBaseMap(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  clearCanvas(ctx);

  // Background
  ctx.fillStyle = "#0B121A";
  ctx.fillRect(0, 0, width, height);

  // Simple "USA frame" placeholder box
  ctx.strokeStyle = "#3C4D5C";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // Subtle grid to mimick tract/county tiling
  ctx.strokeStyle = "rgba(82, 100, 117, 0.3)";
  ctx.lineWidth = 1;

  const cols = 12;
  const rows = 7;
  const cellW = (width - 80) / cols;
  const cellH = (height - 80) / rows;

  for (let i = 0; i <= cols; i++) {
    const x = 40 + i * cellW;
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, height - 40);
    ctx.stroke();
  }

  for (let j = 0; j <= rows; j++) {
    const y = 40 + j * cellH;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
  }
}

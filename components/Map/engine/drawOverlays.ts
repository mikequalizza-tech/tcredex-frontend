// components/Map/engine/drawOverlays.ts
import type { MapLayers } from "../MapContainer";
import { clearCanvas, drawBaseMap } from "./drawBaseMap";

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  layers: MapLayers
) {
  // redraw base first
  drawBaseMap(ctx);

  const { width, height } = ctx.canvas;

  // NMTC — cyan tiles
  if (layers.nmtc) {
    ctx.fillStyle = "rgba(0, 231, 255, 0.25)";
    ctx.fillRect(60, 80, width * 0.35, height * 0.40);
  }

  // OZ — amber-ish
  if (layers.oz) {
    ctx.fillStyle = "rgba(255, 196, 0, 0.25)";
    ctx.fillRect(width * 0.4, height * 0.25, width * 0.35, height * 0.4);
  }

  // LIHTC — purple wash
  if (layers.lihtc) {
    ctx.fillStyle = "rgba(163, 88, 255, 0.25)";
    ctx.fillRect(width * 0.2, height * 0.55, width * 0.5, height * 0.3);
  }

  // Rural — green band
  if (layers.rural) {
    ctx.fillStyle = "rgba(107, 203, 119, 0.18)";
    ctx.fillRect(60, 60, width - 120, height * 0.2);
  }

  // State border emphasis (placeholder)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, 40, width - 80, height - 80);
}

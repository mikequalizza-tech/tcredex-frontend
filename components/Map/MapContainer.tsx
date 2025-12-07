// components/Map/MapContainer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { TogglePanel } from "./controls/TogglePanel";
import { drawBaseMap } from "./engine/drawBaseMap";
import { drawOverlays } from "./engine/drawOverlays";

export type MapLayers = {
  nmtc: boolean;
  oz: boolean;
  lihtc: boolean;
  rural: boolean;
};

const defaultLayers: MapLayers = {
  nmtc: true,
  oz: false,
  lihtc: false,
  rural: false
};

export const MapContainer = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [layers, setLayers] = useState<MapLayers>(defaultLayers);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawBaseMap(ctx);
    drawOverlays(ctx, layers);
  }, [layers]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: "16px",
        background: "var(--neutral-800)",
        padding: "16px",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-soft)"
      }}
    >
      <TogglePanel layers={layers} onChange={setLayers} />

      <div
        style={{
          background: "var(--neutral-900)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--neutral-700)",
          overflow: "hidden"
        }}
      >
        <canvas
          ref={canvasRef}
          width={1000}
          height={600}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
};

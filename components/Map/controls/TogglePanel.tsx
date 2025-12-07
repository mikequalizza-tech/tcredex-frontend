// components/Map/controls/TogglePanel.tsx
"use client";

import type { MapLayers } from "../MapContainer";

type Props = {
  layers: MapLayers;
  onChange: (layers: MapLayers) => void;
};

export const TogglePanel = ({ layers, onChange }: Props) => {
  const toggle = (key: keyof MapLayers) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  return (
    <div
      style={{
        background: "var(--neutral-900)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--neutral-700)",
        padding: "16px",
        color: "var(--neutral-100)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <h3 style={{ margin: 0, marginBottom: "8px" }}>Layers</h3>

      <LayerToggle
        label="NMTC Eligible"
        active={layers.nmtc}
        onClick={() => toggle("nmtc")}
      />
      <LayerToggle
        label="Opportunity Zones"
        active={layers.oz}
        onClick={() => toggle("oz")}
      />
      <LayerToggle
        label="LIHTC QCT / DDA"
        active={layers.lihtc}
        onClick={() => toggle("lihtc")}
      />
      <LayerToggle
        label="Rural / Non-Metro"
        active={layers.rural}
        onClick={() => toggle("rural")}
      />
    </div>
  );
};

const LayerToggle = ({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 10px",
        borderRadius: "var(--radius-sm)",
        border: active
          ? "1px solid var(--tc-primary)"
          : "1px solid var(--neutral-600)",
        background: active ? "rgba(0, 231, 255, 0.08)" : "transparent",
        color: "var(--neutral-100)",
        cursor: "pointer",
        fontSize: "0.9rem"
      }}
    >
      {label}
    </button>
  );
};

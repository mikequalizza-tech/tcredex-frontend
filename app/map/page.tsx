// app/map/page.tsx
import { MapContainer } from "../../components/Map/MapContainer";

export default function MapPage() {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <h1>tCredex — Program Eligibility Map</h1>
      <p style={{ color: "var(--neutral-200)", fontSize: "0.9rem" }}>
        Toggle layers to view NMTC, OZ, LIHTC, and rural overlays. This is the
        1B–2B orchestration shell — wired for real data later.
      </p>
      <MapContainer />
    </div>
  );
}

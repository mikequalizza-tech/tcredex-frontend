"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function TractMap() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283], // US centroid
      zoom: 3,
    });

    mapRef.current = map;

    map.on("load", () => {
      // 🔹 TRACT SOURCE
      map.addSource("tracts", {
        type: "geojson",
        data: "/data/sample-tract.geojson", // replace later
      });

      // 🔹 TRACT FILL
      map.addLayer({
        id: "tract-fill",
        type: "fill",
        source: "tracts",
        paint: {
          "fill-color": "#CBD5E1", // slate-300
          "fill-opacity": 0.35,
        },
      });

      // 🔹 TRACT OUTLINE
      map.addLayer({
        id: "tract-outline",
        type: "line",
        source: "tracts",
        paint: {
          "line-color": "#64748B", // slate-500
          "line-width": 0.5,
        },
      });

      // 🔹 HOVER EFFECT
      map.on("mousemove", "tract-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (!e.features?.length) return;

        const geoid = e.features[0].properties?.GEOID;
        console.log("Hover tract:", geoid);
      });

      map.on("mouseleave", "tract-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      // 🔹 CLICK → SELECT TRACT
      map.on("click", "tract-fill", (e) => {
        if (!e.features?.length) return;
        const geoid = e.features[0].properties?.GEOID;
        console.log("Clicked tract:", geoid);
        // later: fetch backend data
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}

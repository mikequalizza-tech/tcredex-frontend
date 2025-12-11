'use client';

import React from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DealLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface DealMapProps {
  center: DealLocation;
  zoom?: number;
  markers?: DealLocation[];
  height?: string;
  className?: string;
}

const DealMap: React.FC<DealMapProps> = ({
  center,
  zoom = 12,
  markers = [],
  height = '400px',
  className = ''
}) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return (
      <div 
        className={`rounded-xl overflow-hidden shadow-md bg-gray-800 flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <p className="text-gray-400">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden shadow-md ${className}`} style={{ height }}>
      <Map
        initialViewState={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-right" />
        {[center, ...markers].map((loc, idx) => (
          <Marker
            key={idx}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
          >
            <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        ))}
      </Map>
    </div>
  );
};

export default DealMap;

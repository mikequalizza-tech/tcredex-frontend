'use client';

import React, { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DealLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface DealMapProps {
  center?: DealLocation;
  zoom?: number;
  markers?: DealLocation[];
  height?: string;
  className?: string;
  showOverlay?: boolean;
  showLegend?: boolean;
}

const DealMap: React.FC<DealMapProps> = ({
  center = { latitude: 39.8283, longitude: -98.5795 },
  zoom = 4,
  markers = [],
  height = '100%',
  className = '',
  showOverlay = false,
  showLegend = false,
}) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  // Controlled view state that responds to prop changes
  const [viewState, setViewState] = useState({
    latitude: center.latitude,
    longitude: center.longitude,
    zoom: zoom
  });

  // Update view state when center/zoom props change
  useEffect(() => {
    setViewState({
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: zoom
    });
  }, [center.latitude, center.longitude, zoom]);

  if (!mapboxToken) {
    return (
      <div 
        className={`rounded-xl overflow-hidden shadow-md bg-gray-800 flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-gray-400 mb-2">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
          <p className="text-gray-500 text-sm">Add your Mapbox token to .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-md ${className}`} style={{ height }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-right" />
        
        {/* Searched location marker */}
        {center.name && (
          <Marker
            longitude={center.longitude}
            latitude={center.latitude}
            anchor="bottom"
          >
            <div className="relative">
              <div className="w-6 h-6 bg-indigo-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-indigo-500" />
            </div>
          </Marker>
        )}

        {/* Deal markers */}
        {markers.map((loc, idx) => (
          <Marker
            key={idx}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
          >
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
          </Marker>
        ))}
      </Map>

      {/* Deal counter */}
      {showOverlay && (
        <div className="absolute bottom-4 left-4 bg-gray-900/90 rounded-lg px-3 py-2 text-sm z-10">
          <span className="text-green-400 mr-2">●</span>
          <span className="text-gray-300">Total Deals: <strong>127</strong></span>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 bg-gray-900/90 rounded-lg p-3 text-xs z-10">
          <p className="font-semibold text-gray-300 mb-2">Deal Density</p>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Low</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 bg-blue-900" />
              <div className="w-3 h-3 bg-blue-700" />
              <div className="w-3 h-3 bg-blue-500" />
              <div className="w-3 h-3 bg-blue-400" />
              <div className="w-3 h-3 bg-blue-300" />
            </div>
            <span className="text-gray-500">High</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealMap;

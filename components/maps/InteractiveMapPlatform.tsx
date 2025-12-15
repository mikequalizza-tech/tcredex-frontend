'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Deal interface
export interface MapDeal {
  id: string;
  projectName: string;
  location: string;
  parent?: string;
  address?: string;
  censusTract?: string;
  projectCost: number;
  financingGap: number;
  fedNmtcReq?: number;
  stateNmtcReq?: number;
  htc?: number;
  povertyRate?: number;
  medianIncome?: number;
  unemployment?: number;
  shovelReady?: boolean;
  completionDate?: string;
  coordinates?: [number, number];
}

interface InteractiveMapPlatformProps {
  deals: MapDeal[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
  className?: string;
}

// Known coordinates for demo deals
const KNOWN_COORDINATES: Record<string, [number, number]> = {
  'Springfield, IL': [-89.6501, 39.7817],
  'Detroit, MI': [-83.0458, 42.3314],
  'Baltimore, MD': [-76.6122, 39.2904],
  'Cleveland, OH': [-81.6944, 41.4993],
  'Memphis, TN': [-90.0490, 35.1495],
  'St. Louis, MO': [-90.1994, 38.6270],
  'Chicago, IL': [-87.6298, 41.8781],
  'Houston, TX': [-95.3698, 29.7604],
  'Dallas, TX': [-96.7970, 32.7767],
  'Phoenix, AZ': [-112.0740, 33.4484],
  'Philadelphia, PA': [-75.1652, 39.9526],
  'New York, NY': [-74.0060, 40.7128],
  'Los Angeles, CA': [-118.2437, 34.0522],
  'Atlanta, GA': [-84.3880, 33.7490],
  'Miami, FL': [-80.1918, 25.7617],
  'Denver, CO': [-104.9903, 39.7392],
  'Seattle, WA': [-122.3321, 47.6062],
  'Austin, TX': [-97.7431, 30.2672],
  'San Antonio, TX': [-98.4936, 29.4241],
  'New Orleans, LA': [-90.0715, 29.9511],
};

function getCoordinatesForDeal(deal: MapDeal): [number, number] | null {
  if (deal.coordinates) return deal.coordinates;
  
  for (const [city, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (deal.location.toLowerCase().includes(city.toLowerCase().split(',')[0])) {
      return coords;
    }
  }
  return null;
}

export default function InteractiveMapPlatform({
  deals,
  selectedDealId,
  onSelectDeal,
  className = '',
}: InteractiveMapPlatformProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    if (!mapboxToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95.7129, 37.0902],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
      if (!map.current) return;

      // Add state boundaries
      map.current.addSource('states', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
      });
      
      map.current.addLayer({
        id: 'state-fills',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': '#1e3a5f',
          'fill-opacity': 0.15
        }
      });
      
      map.current.addLayer({
        id: 'state-borders',
        type: 'line',
        source: 'states',
        paint: {
          'line-color': '#4a5568',
          'line-width': 1
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update deal markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    deals.forEach((deal) => {
      const coords = getCoordinatesForDeal(deal);
      if (!coords) return;

      const isSelected = deal.id === selectedDealId;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'deal-marker';
      el.innerHTML = `
        <div style="
          width: ${isSelected ? '24px' : '18px'};
          height: ${isSelected ? '24px' : '18px'};
          background: ${isSelected ? '#818cf8' : '#6366f1'};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s;
          ${isSelected ? 'box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.4);' : ''}
        ">
          ${deal.shovelReady ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              width: 10px;
              height: 10px;
              background: #4ade80;
              border: 2px solid white;
              border-radius: 50%;
            "></div>
          ` : ''}
        </div>
      `;
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current!);

      // Click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectDeal(deal.id);
      });

      // Popup on hover
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${deal.projectName}</h3>
          <p style="font-size: 12px; color: #818cf8; margin-bottom: 8px;">${deal.location}</p>
          <div style="font-size: 12px; display: grid; gap: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Project Cost:</span>
              <span>$${(deal.projectCost / 1000000).toFixed(1)}M</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Gap:</span>
              <span style="color: #fb923c;">$${(deal.financingGap / 1000000).toFixed(2)}M</span>
            </div>
            ${deal.povertyRate ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #9ca3af;">Poverty:</span>
                <span>${deal.povertyRate}%</span>
              </div>
            ` : ''}
          </div>
          ${deal.shovelReady ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
              <span style="color: #4ade80; font-size: 12px;">✓ Shovel Ready</span>
            </div>
          ` : ''}
        </div>
      `);

      el.addEventListener('mouseenter', () => {
        marker.setPopup(popup);
        popup.addTo(map.current!);
      });

      el.addEventListener('mouseleave', () => {
        popup.remove();
      });

      markersRef.current.set(deal.id, marker);
    });
  }, [deals, selectedDealId, mapLoaded, onSelectDeal]);

  // Fly to selected deal
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedDealId) return;

    const selectedDeal = deals.find(d => d.id === selectedDealId);
    if (!selectedDeal) return;

    const coords = getCoordinatesForDeal(selectedDeal);
    if (!coords) return;

    map.current.flyTo({
      center: coords,
      zoom: 10,
      duration: 1500,
    });
  }, [selectedDealId, deals, mapLoaded]);

  if (!mapboxToken) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <p className="text-gray-400 mb-2">Map requires configuration</p>
          <p className="text-sm text-gray-600">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full border border-white"></div>
            <span className="text-xs text-gray-400">Active Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-indigo-500 rounded-full border border-white"></div>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-400">Shovel Ready</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
          {deals.length} deals shown
        </div>
      </div>

      {/* Loading */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}

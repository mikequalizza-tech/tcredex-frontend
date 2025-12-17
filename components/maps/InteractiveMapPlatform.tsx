'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// =============================================================================
// TYPES
// =============================================================================

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

interface TractInfo {
  geoid: string;
  eligible: boolean;
  severelyDistressed: boolean;
  povertyRate?: number;
  medianIncome?: number;
  unemploymentRate?: number;
  programs: string[];
}

interface InteractiveMapPlatformProps {
  deals: MapDeal[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
  onTractClick?: (tract: TractInfo) => void;
  className?: string;
  centerLocation?: [number, number] | null;
  showTracts?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

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

// Tract colors
const TRACT_COLORS = {
  eligible: '#10b981',           // Emerald
  severelyDistressed: '#f97316', // Orange
  opportunityZone: '#8b5cf6',    // Purple
  nonEligible: '#374151',        // Gray
  hover: '#6366f1',              // Indigo
  default: '#f97316',            // Orange (default visible)
};

const MIN_TRACT_ZOOM = 8;

// =============================================================================
// HELPERS
// =============================================================================

function getCoordinatesForDeal(deal: MapDeal): [number, number] | null {
  if (deal.coordinates) return deal.coordinates;
  for (const [city, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (deal.location.toLowerCase().includes(city.toLowerCase().split(',')[0])) {
      return coords;
    }
  }
  return null;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function InteractiveMapPlatform({
  deals,
  selectedDealId,
  onSelectDeal,
  onTractClick,
  className = '',
  centerLocation,
  showTracts = true,
}: InteractiveMapPlatformProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [tractsLoading, setTractsLoading] = useState(false);
  const [tractEligibility, setTractEligibility] = useState<Map<string, TractInfo>>(new Map());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Fetch eligibility for a tract
  const fetchTractEligibility = useCallback(async (geoid: string): Promise<TractInfo | null> => {
    if (tractEligibility.has(geoid)) {
      return tractEligibility.get(geoid)!;
    }
    try {
      const response = await fetch(`/api/eligibility?tract=${geoid}`);
      if (!response.ok) return null;
      const data = await response.json();
      const info: TractInfo = {
        geoid,
        eligible: data.eligible || false,
        severelyDistressed: data.federal?.severely_distressed || false,
        povertyRate: data.federal?.poverty_rate,
        medianIncome: data.federal?.median_income_pct,
        unemploymentRate: data.federal?.unemployment_rate,
        programs: data.programs || [],
      };
      setTractEligibility(prev => new Map(prev).set(geoid, info));
      return info;
    } catch {
      return null;
    }
  }, [tractEligibility]);

  // Load tracts for current viewport
  const loadTractsForViewport = useCallback(async () => {
    if (!map.current || !mapLoaded || !showTracts) return;
    
    const zoom = map.current.getZoom();
    if (zoom < MIN_TRACT_ZOOM) {
      // Remove tract layer if zoomed out
      if (map.current.getSource('tracts')) {
        map.current.removeLayer('tract-fills');
        map.current.removeLayer('tract-outlines');
        map.current.removeSource('tracts');
      }
      return;
    }

    setTractsLoading(true);
    
    try {
      const bounds = map.current.getBounds();
      if (!bounds) return;
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      
      const response = await fetch(`/api/geo/tracts?bbox=${bbox}&limit=300`);
      if (!response.ok) throw new Error('Failed to fetch tracts');
      
      const geojson = await response.json();
      
      if (!map.current) return;

      // Update or add source
      const source = map.current.getSource('tracts') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      } else {
        map.current.addSource('tracts', {
          type: 'geojson',
          data: geojson,
        });

        // Add fill layer
        map.current.addLayer({
          id: 'tract-fills',
          type: 'fill',
          source: 'tracts',
          paint: {
            'fill-color': TRACT_COLORS.default,
            'fill-opacity': 0.35,
          }
        }, 'state-borders');

        // Add outline layer
        map.current.addLayer({
          id: 'tract-outlines',
          type: 'line',
          source: 'tracts',
          paint: {
            'line-color': TRACT_COLORS.default,
            'line-width': 1,
            'line-opacity': 0.7,
          }
        }, 'state-borders');
      }

    } catch (error) {
      console.error('Error loading tracts:', error);
    } finally {
      setTractsLoading(false);
    }
  }, [mapLoaded, showTracts]);

  // Debounced version for map move
  const debouncedLoadTracts = useCallback(
    debounce(loadTractsForViewport, 500),
    [loadTractsForViewport]
  );

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!mapboxToken) return;

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
      if (!map.current) return;
      
      // State boundaries
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
          'fill-opacity': 0.1
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

      setMapLoaded(true);
    });

    // Track zoom level
    map.current.on('zoom', () => {
      if (map.current) {
        setCurrentZoom(map.current.getZoom());
      }
    });

    // Load tracts on move
    map.current.on('moveend', () => {
      debouncedLoadTracts();
    });

    // Tract click handler
    map.current.on('click', 'tract-fills', async (e) => {
      if (!e.features?.[0]) return;
      const geoid = e.features[0].properties?.GEOID;
      if (geoid && onTractClick) {
        const info = await fetchTractEligibility(geoid);
        if (info) onTractClick(info);
      }
    });

    // Tract hover
    map.current.on('mouseenter', 'tract-fills', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'tract-fills', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    });

    map.current.on('mousemove', 'tract-fills', async (e) => {
      if (!e.features?.[0] || !map.current) return;
      const geoid = e.features[0].properties?.GEOID;
      if (!geoid) return;

      const info = await fetchTractEligibility(geoid);
      
      if (popupRef.current) popupRef.current.remove();
      
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
      })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 180px;">
            <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">Census Tract</div>
            <div style="font-size: 14px; font-weight: 600; font-family: monospace; margin-bottom: 8px;">${geoid}</div>
            ${info ? `
              <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
                ${info.eligible ? `
                  <span style="background: #10b98133; color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">
                    ✓ NMTC Eligible
                  </span>
                ` : `
                  <span style="background: #6b728033; color: #9ca3af; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                    Not Eligible
                  </span>
                `}
                ${info.severelyDistressed ? `
                  <span style="background: #f9731633; color: #f97316; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">
                    Severely Distressed
                  </span>
                ` : ''}
              </div>
              ${info.povertyRate !== undefined ? `
                <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="color: #9ca3af;">Poverty:</span>
                  <span>${info.povertyRate.toFixed(1)}%</span>
                </div>
              ` : ''}
              ${info.medianIncome !== undefined ? `
                <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span style="color: #9ca3af;">MFI:</span>
                  <span>${info.medianIncome.toFixed(1)}%</span>
                </div>
              ` : ''}
            ` : `
              <div style="font-size: 11px; color: #6b7280;">Loading eligibility...</div>
            `}
          </div>
        `)
        .addTo(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, debouncedLoadTracts, fetchTractEligibility, onTractClick]);

  // Load tracts when map is ready
  useEffect(() => {
    if (mapLoaded && showTracts) {
      loadTractsForViewport();
    }
  }, [mapLoaded, showTracts, loadTractsForViewport]);

  // Deal markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    deals.forEach((deal) => {
      const coords = getCoordinatesForDeal(deal);
      if (!coords) return;

      const isSelected = deal.id === selectedDealId;
      
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: ${isSelected ? '28px' : '20px'};
          height: ${isSelected ? '28px' : '20px'};
          background: ${isSelected ? '#818cf8' : '#6366f1'};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: all 0.2s;
          ${isSelected ? 'box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.5);' : ''}
        ">
          ${deal.shovelReady ? `
            <div style="
              position: absolute; top: -4px; right: -4px;
              width: 12px; height: 12px;
              background: #4ade80; border: 2px solid white; border-radius: 50%;
            "></div>
          ` : ''}
        </div>
      `;
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectDeal(deal.id);
      });

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
              <span style="color: #9ca3af;">Cost:</span>
              <span>$${(deal.projectCost / 1000000).toFixed(1)}M</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Gap:</span>
              <span style="color: #fb923c;">$${(deal.financingGap / 1000000).toFixed(2)}M</span>
            </div>
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
      el.addEventListener('mouseleave', () => popup.remove());

      markersRef.current.set(deal.id, marker);
    });
  }, [deals, selectedDealId, mapLoaded, onSelectDeal]);

  // Fly to selected deal
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedDealId) return;
    const deal = deals.find(d => d.id === selectedDealId);
    if (!deal) return;
    const coords = getCoordinatesForDeal(deal);
    if (!coords) return;
    map.current.flyTo({ center: coords, zoom: 12, duration: 1500 });
  }, [selectedDealId, deals, mapLoaded]);

  // Fly to searched location
  useEffect(() => {
    if (!map.current || !mapLoaded || !centerLocation) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="
        width: 24px; height: 24px;
        background: #ef4444; border: 3px solid white; border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      </style>
    `;

    searchMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat(centerLocation)
      .addTo(map.current);

    map.current.flyTo({ center: centerLocation, zoom: 12, duration: 1500 });
  }, [centerLocation, mapLoaded]);

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

      {/* Zoom hint */}
      {showTracts && currentZoom < MIN_TRACT_ZOOM && (
        <div className="absolute top-4 left-16 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
          <p className="text-xs text-gray-400">
            <span className="text-orange-400">🗺️</span> Zoom in to see census tract polygons
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {tractsLoading && (
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400">Loading tracts...</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full border border-white"></div>
            <span className="text-xs text-gray-400">Search Location</span>
          </div>
          {showTracts && currentZoom >= MIN_TRACT_ZOOM && (
            <>
              <div className="w-full h-px bg-gray-700 my-2" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: TRACT_COLORS.default, opacity: 0.5 }}></div>
                <span className="text-xs text-gray-400">Census Tract</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
          {deals.length} deals • Zoom {currentZoom.toFixed(0)}
        </div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

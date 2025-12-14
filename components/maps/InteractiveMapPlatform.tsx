'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Deal interface matching our data model
export interface MapDeal {
  id: string;
  projectName: string;
  location: string;
  address?: string;
  censusTract?: string;
  projectCost: number;
  financingGap: number;
  fedNmtcReq?: number;
  povertyRate?: number;
  medianIncome?: number;
  unemployment?: number;
  shovelReady?: boolean;
  coordinates?: [number, number]; // [lng, lat]
}

interface InteractiveMapPlatformProps {
  deals: MapDeal[];
  selectedDealId: string | null;
  onSelectDeal: (dealId: string | null) => void;
  onTractClick?: (tractId: string, data: TractData) => void;
  showTractLayers?: boolean;
  showDealPins?: boolean;
  showLegend?: boolean;
  className?: string;
}

interface TractData {
  tractId: string;
  povertyRate: number;
  medianIncomePct: number;
  unemployment?: number;
  isEligible: boolean;
  isSeverelyDistressed: boolean;
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

// Geocode cache
const geocodeCache: Record<string, [number, number]> = {};

function getCoordinatesForDeal(deal: MapDeal): [number, number] | null {
  if (deal.coordinates) return deal.coordinates;
  if (geocodeCache[deal.location]) return geocodeCache[deal.location];
  
  for (const [city, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (deal.location.toLowerCase().includes(city.toLowerCase().split(',')[0])) {
      geocodeCache[deal.location] = coords;
      return coords;
    }
  }
  return null;
}

export default function InteractiveMapPlatform({
  deals,
  selectedDealId,
  onSelectDeal,
  onTractClick,
  showTractLayers = true,
  showDealPins = true,
  showLegend = true,
  className = '',
}: InteractiveMapPlatformProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);

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
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-left'
    );

    // Track zoom level
    map.current.on('zoom', () => {
      if (map.current) {
        setCurrentZoom(Math.floor(map.current.getZoom()));
      }
    });

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
          'line-width': 1.5
        }
      });

      // Add county boundaries (visible at zoom 6+)
      map.current.addSource('counties', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      });

      map.current.addLayer({
        id: 'county-boundaries',
        type: 'line',
        source: 'counties',
        'source-layer': 'admin',
        minzoom: 6,
        filter: ['==', ['get', 'admin_level'], 4],
        paint: {
          'line-color': '#6366f1',
          'line-width': 0.5,
          'line-opacity': 0.5
        }
      });

      // Add census tract boundaries using Census Bureau TIGERweb
      // Using WMS tiles as a raster layer (free and reliable)
      map.current.addSource('census-tracts-wms', {
        type: 'raster',
        tiles: [
          'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:0,2&f=image'
        ],
        tileSize: 256,
        minzoom: 9,
        maxzoom: 18
      });

      map.current.addLayer({
        id: 'census-tracts-layer',
        type: 'raster',
        source: 'census-tracts-wms',
        minzoom: 9,
        paint: {
          'raster-opacity': 0.6
        }
      });

      // Alternative: Add vector tract boundaries from Census GeoJSON (for specific areas)
      // This loads tract boundaries for a sample state when zoomed in
      map.current.addSource('tract-boundaries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.current.addLayer({
        id: 'tract-fills',
        type: 'fill',
        source: 'tract-boundaries',
        minzoom: 10,
        paint: {
          'fill-color': [
            'case',
            ['get', 'eligible'],
            '#22c55e', // green for eligible
            '#6366f1'  // indigo for non-eligible
          ],
          'fill-opacity': 0.3
        }
      });

      map.current.addLayer({
        id: 'tract-outlines',
        type: 'line',
        source: 'tract-boundaries',
        minzoom: 10,
        paint: {
          'line-color': '#818cf8',
          'line-width': 1
        }
      });

      // Click handler for map (reverse geocode to find tract)
      map.current.on('click', async (e) => {
        if (!map.current || map.current.getZoom() < 9) return;
        
        const { lng, lat } = e.lngLat;
        
        // Query Census Geocoder for tract info
        try {
          const response = await fetch(
            `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=Census%20Tracts&format=json`
          );
          const data = await response.json();
          
          if (data.result?.geographies?.['Census Tracts']?.[0]) {
            const tract = data.result.geographies['Census Tracts'][0];
            const tractId = tract.GEOID;
            const stateName = tract.STATE;
            const countyName = tract.COUNTY;
            
            // Fetch our eligibility data
            const eligibilityResponse = await fetch(`/api/tracts/lookup?geoid=${tractId}`);
            let eligibilityData = null;
            if (eligibilityResponse.ok) {
              eligibilityData = await eligibilityResponse.json();
            }
            
            // Build tract data
            const tractData: TractData = {
              tractId,
              povertyRate: eligibilityData?.poverty || 0,
              medianIncomePct: eligibilityData?.income || 0,
              unemployment: eligibilityData?.unemployment,
              isEligible: eligibilityData?.eligible || false,
              isSeverelyDistressed: eligibilityData?.povertyQualifies && eligibilityData?.poverty >= 30,
            };

            if (onTractClick) {
              onTractClick(tractId, tractData);
            }

            // Show popup
            if (popupRef.current) popupRef.current.remove();
            
            const eligibleClass = tractData.isEligible ? 'text-green-400' : 'text-gray-400';
            const distressedBadge = tractData.isSeverelyDistressed 
              ? '<div class="text-orange-400 text-xs mt-1">⚠ Severely Distressed</div>' 
              : '';
            
            popupRef.current = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: false,
            })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="background: #1f2937; color: white; padding: 16px; border-radius: 8px; min-width: 260px;">
                  <h3 style="font-weight: bold; font-size: 14px; color: #818cf8; margin-bottom: 8px;">Census Tract ${tractId}</h3>
                  <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">${tract.NAME}, ${countyName} County</div>
                  
                  <div style="display: grid; gap: 4px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #9ca3af;">Poverty Rate:</span>
                      <span style="color: ${tractData.povertyRate >= 20 ? '#fb923c' : '#4ade80'};">${tractData.povertyRate.toFixed(1)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #9ca3af;">Median Income:</span>
                      <span style="color: ${tractData.medianIncomePct <= 80 ? '#fb923c' : '#4ade80'};">${tractData.medianIncomePct.toFixed(1)}% AMI</span>
                    </div>
                    ${tractData.unemployment ? `
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #9ca3af;">Unemployment:</span>
                      <span>${tractData.unemployment.toFixed(1)}%</span>
                    </div>
                    ` : ''}
                  </div>
                  
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
                    <span style="color: #9ca3af;">NMTC Eligible:</span>
                    <span class="${eligibleClass}" style="margin-left: 8px; color: ${tractData.isEligible ? '#4ade80' : '#ef4444'};">
                      ${tractData.isEligible ? '✓ Yes' : '✗ No'}
                    </span>
                    ${distressedBadge}
                  </div>
                </div>
              `)
              .addTo(map.current!);
          }
        } catch (error) {
          console.error('Failed to lookup tract:', error);
        }
      });

      // Cursor change on hover at high zoom
      map.current.on('mousemove', () => {
        if (map.current && map.current.getZoom() >= 9) {
          map.current.getCanvas().style.cursor = 'crosshair';
        }
      });

      map.current.on('mouseout', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, onTractClick]);

  // Update deal markers
  useEffect(() => {
    if (!map.current || !mapLoaded || !showDealPins) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    deals.forEach((deal) => {
      const coords = getCoordinatesForDeal(deal);
      if (!coords) return;

      const isSelected = deal.id === selectedDealId;
      
      const el = document.createElement('div');
      el.className = 'deal-marker-container';
      el.innerHTML = `
        <div class="relative group cursor-pointer">
          <div class="w-5 h-5 rounded-full ${isSelected 
            ? 'bg-indigo-400 ring-4 ring-indigo-400/40 scale-125' 
            : 'bg-indigo-500 hover:bg-indigo-400'} 
            border-2 border-white shadow-lg transition-all duration-200 hover:scale-125">
          </div>
          ${deal.shovelReady ? `
            <div class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></div>
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
        <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 220px;">
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${deal.projectName}</h3>
          <p style="font-size: 12px; color: #818cf8; margin-bottom: 8px;">${deal.location}</p>
          <div style="display: grid; gap: 4px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Project Cost:</span>
              <span style="font-weight: 500;">$${(deal.projectCost / 1000000).toFixed(1)}M</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #9ca3af;">Financing Gap:</span>
              <span style="color: #fb923c; font-weight: 500;">$${(deal.financingGap / 1000000).toFixed(2)}M</span>
            </div>
            ${deal.fedNmtcReq ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #9ca3af;">NMTC Request:</span>
                <span style="color: #4ade80; font-weight: 500;">$${(deal.fedNmtcReq / 1000000).toFixed(1)}M</span>
              </div>
            ` : ''}
            ${deal.povertyRate ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #9ca3af;">Poverty Rate:</span>
                <span style="color: ${deal.povertyRate >= 30 ? '#fb923c' : '#facc15'};">${deal.povertyRate}%</span>
              </div>
            ` : ''}
          </div>
          ${deal.shovelReady ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
              <span style="color: #4ade80; font-size: 12px;">✓ Shovel Ready</span>
            </div>
          ` : ''}
          <div style="margin-top: 8px; text-align: center;">
            <span style="color: #818cf8; font-size: 11px;">Click for details</span>
          </div>
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
  }, [deals, selectedDealId, mapLoaded, showDealPins, onSelectDeal]);

  // Fly to selected deal
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedDealId) return;

    const selectedDeal = deals.find(d => d.id === selectedDealId);
    if (!selectedDeal) return;

    const coords = getCoordinatesForDeal(selectedDeal);
    if (!coords) return;

    map.current.flyTo({
      center: coords,
      zoom: 12,
      duration: 1500,
      essential: true
    });

    markersRef.current.forEach((marker, dealId) => {
      const el = marker.getElement();
      const innerDiv = el.querySelector('.deal-marker-container > div > div:first-child');
      if (innerDiv) {
        if (dealId === selectedDealId) {
          innerDiv.className = 'w-5 h-5 rounded-full bg-indigo-400 ring-4 ring-indigo-400/40 scale-125 border-2 border-white shadow-lg transition-all duration-200';
        } else {
          innerDiv.className = 'w-5 h-5 rounded-full bg-indigo-500 hover:bg-indigo-400 border-2 border-white shadow-lg transition-all duration-200 hover:scale-125';
        }
      }
    });
  }, [selectedDealId, deals, mapLoaded]);

  if (!mapboxToken) {
    return (
      <div className={`w-full h-full bg-gray-900 flex flex-col items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-gray-400 mb-2 font-medium">Map requires configuration</p>
          <p className="text-sm text-gray-600 max-w-md">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local<br />
            Get a free token at <a href="https://mapbox.com" className="text-indigo-400 hover:underline">mapbox.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-gray-900/95 rounded-lg p-4 border border-gray-700 z-10 max-w-[200px]">
          <p className="text-xs font-semibold text-gray-300 mb-3">Map Legend</p>
          
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Deal Markers</p>
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
                <div className="w-3 h-3 bg-indigo-400 rounded-full border border-white ring-2 ring-indigo-400/40"></div>
                <span className="text-xs text-gray-400">Selected</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Census Tracts</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/60 rounded"></div>
                <span className="text-xs text-gray-400">NMTC Eligible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500/60 rounded"></div>
                <span className="text-xs text-gray-400">Severely Distressed</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total Deals:</span>
              <span className="text-green-400 font-medium">{deals.length}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Shovel Ready:</span>
              <span className="text-indigo-400 font-medium">{deals.filter(d => d.shovelReady).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 text-xs z-10">
        <div className="text-gray-400">
          {currentZoom < 9 ? (
            <span>Zoom in for tract details (Zoom {currentZoom}/9+)</span>
          ) : (
            <span className="text-green-400">Click map for tract info</span>
          )}
        </div>
      </div>

      {/* National stats */}
      <div className="absolute top-4 left-16 bg-gray-900/90 rounded-lg px-3 py-2 text-xs z-10">
        <div className="text-gray-400">
          <span className="text-indigo-400 font-semibold">35,167</span> eligible tracts nationwide
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

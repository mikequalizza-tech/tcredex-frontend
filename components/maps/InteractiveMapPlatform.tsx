'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
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

const TRACT_FILL_COLOR = '#f97316';
const TRACT_FILL_OPACITY = 0.25;
const TRACT_LINE_COLOR = '#f97316';
const TRACT_LINE_WIDTH = 1.5;
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
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapboxModule = useRef<any>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isLoadingTracts = useRef(false);
  const initStarted = useRef(false);
  
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [tractsLoading, setTractsLoading] = useState(false);
  const [tractCount, setTractCount] = useState(0);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ==========================================================================
  // LOAD TRACTS FOR VIEWPORT
  // ==========================================================================
  const loadTractsForViewport = useCallback(async () => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !showTracts) return;
    if (isLoadingTracts.current) return;
    
    const zoom = map.getZoom();
    if (zoom < MIN_TRACT_ZOOM) {
      setTractCount(0);
      // Clear tracts when zoomed out
      const source = map.getSource('tracts') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }

    isLoadingTracts.current = true;
    setTractsLoading(true);
    
    try {
      const bounds = map.getBounds();
      if (!bounds) return;
      
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      console.log('[Map] Loading tracts for bbox:', bbox);
      
      // Fetch tract geometries from Census TigerWeb
      const response = await fetch(`/api/geo/tracts?bbox=${bbox}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch tracts');
      
      const geojson = await response.json();
      
      // Verify map still exists
      if (!mapInstanceRef.current) return;

      if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        console.warn('[Map] Invalid GeoJSON');
        return;
      }

      console.log('[Map] Got', geojson.features.length, 'tract geometries');

      // Enrich first 30 tracts with eligibility data
      const tractsToEnrich = geojson.features.slice(0, 30);
      const enrichmentPromises = tractsToEnrich.map(async (feature: GeoJSON.Feature) => {
        const geoid = feature.properties?.GEOID;
        if (!geoid) {
          return {
            ...feature,
            id: `tract-${Math.random()}`,
            properties: {
              ...feature.properties,
              eligible: false,
              programs: JSON.stringify([]),
              severelyDistressed: false,
            }
          };
        }
        
        try {
          const eligRes = await fetch(`/api/eligibility?tract=${geoid}`);
          const eligData = await eligRes.json();
          
          // 🔍 DEBUG: Log eligibility response
          if (eligData.eligible) {
            console.log(`[Map] ✓ Tract ${geoid} is ELIGIBLE:`, eligData.programs);
          } else if (eligData.reason?.includes('not found')) {
            console.warn(`[Map] ⚠ Tract ${geoid} NOT FOUND in DB`);
          }
          
          return {
            ...feature,
            id: geoid,
            properties: {
              ...feature.properties,
              geoid,
              eligible: eligData.eligible || false,
              programs: JSON.stringify(eligData.programs || []),
              povertyRate: eligData.federal?.poverty_rate?.toFixed(1) || null,
              medianIncomePct: eligData.federal?.median_income_pct?.toFixed(0) || null,
              stateName: eligData.location?.state || null,
              countyName: eligData.location?.county || null,
              severelyDistressed: eligData.federal?.severely_distressed || false,
            }
          };
        } catch (error) {
          console.warn(`[Map] Failed to get eligibility for ${geoid}:`, error);
          return {
            ...feature,
            id: geoid,
            properties: {
              ...feature.properties,
              geoid,
              eligible: false,
              programs: JSON.stringify([]),
              severelyDistressed: false,
            }
          };
        }
      });

      const enrichedFeatures = await Promise.all(enrichmentPromises);
      
      // Add remaining tracts without eligibility (they'll show as neutral)
      const remainingFeatures = geojson.features.slice(30).map((feature: GeoJSON.Feature) => ({
        ...feature,
        id: feature.properties?.GEOID || `tract-${Math.random()}`,
        properties: {
          ...feature.properties,
          eligible: false,
          programs: JSON.stringify([]),
          severelyDistressed: false,
        }
      }));

      const allFeatures = [...enrichedFeatures, ...remainingFeatures];
      console.log('[Map] Enriched', enrichedFeatures.length, 'tracts with eligibility data');
      setTractCount(allFeatures.length);

      // Update the source data
      const source = map.getSource('tracts') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: allFeatures
        });
      }

    } catch (error) {
      console.error('[Map] Error loading tracts:', error);
    } finally {
      isLoadingTracts.current = false;
      setTractsLoading(false);
    }
  }, [showTracts]);

  // ==========================================================================
  // INITIALIZE MAP (runs once)
  // ==========================================================================
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (initStarted.current) return;
    initStarted.current = true;

    let mounted = true;
    let map: mapboxgl.Map | null = null;

    const initMap = async () => {
      try {
        console.log('[Map] Starting map initialization...');
        const mapboxgl = (await import('mapbox-gl')).default;
        if (!mounted) return;
        
        console.log('[Map] Mapbox module loaded, setting token...');
        mapboxModule.current = mapboxgl;
        mapboxgl.accessToken = mapboxToken;
        
        console.log('[Map] Creating map instance...');
        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-95.7129, 37.0902],
          zoom: 4,
          minZoom: 3,
          maxZoom: 18,
        });

        mapInstanceRef.current = map;
        console.log('[Map] Map instance created, adding controls...');

        map.addControl(new mapboxgl.NavigationControl(), 'top-left');
        map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        map.on('load', () => {
          if (!mounted || !map) return;
          console.log('[Map] ✓ Mapbox loaded successfully!');
          
          // Add tract source (empty initially)
          map.addSource('tracts', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // Add tract fill layer - use CDFI Fund color scheme
          map.addLayer({
            id: 'tract-fills',
            type: 'fill',
            source: 'tracts',
            paint: {
              'fill-color': [
                'case',
                // Eligible tracts
                ['==', ['get', 'eligible'], true],
                [
                  'case',
                  // Severely distressed = red (like CDFI map)
                  ['==', ['get', 'severelyDistressed'], true], '#dc2626',
                  // Regular eligible = purple (like CDFI map) 
                  '#7c3aed'
                ],
                // Not eligible = light gray (subtle)
                '#e5e7eb'
              ],
              'fill-opacity': [
                'case',
                // Eligible tracts are visible
                ['==', ['get', 'eligible'], true], 0.6,
                // Not eligible are very subtle
                0.2
              ]
            },
          });

          // Add tract outline layer
          map.addLayer({
            id: 'tract-outlines',
            type: 'line',
            source: 'tracts',
            paint: {
              'line-color': [
                'case',
                ['==', ['get', 'eligible'], true],
                [
                  'case',
                  ['==', ['get', 'severelyDistressed'], true], '#991b1b', // Dark red
                  '#5b21b6' // Dark purple
                ],
                '#d1d5db' // Light gray for not eligible
              ],
              'line-width': TRACT_LINE_WIDTH,
              'line-opacity': 0.8,
            },
          });

          console.log('[Map] Layers added, setting mapReady to true');
          setMapReady(true);
        });

        map.on('error', (e) => {
          console.error('[Map] Mapbox error:', e);
        });

        console.log('[Map] Event listeners added, waiting for load event...');

        // Fallback timeout in case map never loads
        setTimeout(() => {
          if (!mapReady) {
            console.warn('[Map] Map load timeout - forcing mapReady to true');
            setMapReady(true);
          }
        }, 10000); // 10 second timeout

        // Track zoom
        map.on('zoom', () => {
          if (mounted && map) {
            setCurrentZoom(map.getZoom());
          }
        });

        // Load tracts on move end (debounced naturally by mapbox)
        let moveTimeout: NodeJS.Timeout | null = null;
        map.on('moveend', () => {
          if (moveTimeout) clearTimeout(moveTimeout);
          moveTimeout = setTimeout(() => {
            if (mounted && mapInstanceRef.current) {
              loadTractsForViewport();
            }
          }, 300);
        });

        // Tract hover
        map.on('mouseenter', 'tract-fills', () => {
          if (map) map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'tract-fills', () => {
          if (map) map.getCanvas().style.cursor = '';
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        });

        // Tract hover popup
        map.on('mousemove', 'tract-fills', async (e) => {
          if (!e.features?.[0] || !map || !mapboxgl) return;
          const feature = e.features[0];
          const geoid = feature.properties?.GEOID || feature.properties?.geoid;
          const eligible = feature.properties?.eligible === true || feature.properties?.eligible === 'true';
          
          if (!geoid) return;

          if (popupRef.current) popupRef.current.remove();
          
          let programs: string[] = [];
          try {
            programs = feature.properties?.programs ? JSON.parse(feature.properties.programs) : [];
          } catch {
            programs = [];
          }
          
          popupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 15,
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; min-width: 200px; font-family: system-ui; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 20px;">${eligible ? '✓' : '✗'}</span>
                  <span style="font-weight: 600; font-size: 14px; color: ${eligible ? '#4ade80' : '#f87171'};">
                    ${eligible ? 'NMTC Eligible' : 'Not Eligible'}
                  </span>
                </div>
                <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">
                  Census Tract: <span style="font-family: monospace; color: #d1d5db; font-weight: 500;">${geoid}</span>
                </p>
                ${programs.length > 0 ? `
                  <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                    ${programs.map((p: string) => `
                      <span style="
                        padding: 3px 8px;
                        font-size: 10px;
                        font-weight: 600;
                        border-radius: 9999px;
                        background: ${p.includes('NMTC') ? 'rgba(34, 197, 94, 0.2)' : p === 'Opportunity Zone' ? 'rgba(168, 85, 247, 0.2)' : p === 'Severely Distressed' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
                        color: ${p.includes('NMTC') ? '#4ade80' : p === 'Opportunity Zone' ? '#c084fc' : p === 'Severely Distressed' ? '#fb923c' : '#60a5fa'};
                        border: 1px solid ${p.includes('NMTC') ? 'rgba(34, 197, 94, 0.4)' : p === 'Opportunity Zone' ? 'rgba(168, 85, 247, 0.4)' : p === 'Severely Distressed' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(59, 130, 246, 0.4)'};
                      ">${p}</span>
                    `).join('')}
                  </div>
                ` : ''}
                ${feature.properties?.povertyRate || feature.properties?.medianIncomePct ? `
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 10px; border-top: 1px solid #374151; font-size: 12px;">
                    <div>
                      <p style="color: #6b7280; font-size: 10px; margin-bottom: 2px;">Poverty Rate</p>
                      <p style="font-weight: 600; color: ${parseFloat(feature.properties?.povertyRate || '0') >= 20 ? '#fb923c' : '#d1d5db'};">${feature.properties?.povertyRate ? feature.properties.povertyRate + '%' : 'N/A'}</p>
                    </div>
                    <div>
                      <p style="color: #6b7280; font-size: 10px; margin-bottom: 2px;">Median Income</p>
                      <p style="font-weight: 600; color: ${parseFloat(feature.properties?.medianIncomePct || '100') <= 80 ? '#fb923c' : '#d1d5db'};">${feature.properties?.medianIncomePct ? feature.properties.medianIncomePct + '% AMI' : 'N/A'}</p>
                    </div>
                  </div>
                ` : ''}
                ${feature.properties?.stateName ? `
                  <p style="font-size: 10px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
                    📍 ${feature.properties?.countyName ? feature.properties.countyName + ', ' : ''}${feature.properties.stateName}
                  </p>
                ` : ''}
              </div>
            `)
            .addTo(map);
        });

        // Tract click - with debug logging (Gemini's suggestion)
        map.on('click', 'tract-fills', (e) => {
          if (!e.features?.[0]) return;
          
          // 🔍 DEBUG: Log all properties to console (open F12 to see)
          console.log('=== CLICKED TRACT DEBUG ===');
          console.log('Raw properties:', e.features[0].properties);
          console.log('GEOID:', e.features[0].properties?.GEOID);
          console.log('geoid:', e.features[0].properties?.geoid);
          console.log('eligible:', e.features[0].properties?.eligible, 'type:', typeof e.features[0].properties?.eligible);
          console.log('severelyDistressed:', e.features[0].properties?.severelyDistressed);
          console.log('programs:', e.features[0].properties?.programs);
          console.log('===========================');

          const geoid = e.features[0].properties?.GEOID || e.features[0].properties?.geoid;
          const eligible = e.features[0].properties?.eligible === true || e.features[0].properties?.eligible === 'true';
          const severelyDistressed = e.features[0].properties?.severelyDistressed === true || e.features[0].properties?.severelyDistressed === 'true';
          
          let programs: string[] = [];
          try {
            const progStr = e.features[0].properties?.programs;
            programs = progStr ? JSON.parse(progStr) : [];
          } catch {
            programs = [];
          }
          
          if (geoid && onTractClick) {
            onTractClick({
              geoid,
              eligible,
              severelyDistressed,
              programs,
            });
          }
        });

      } catch (error) {
        console.error('[Map] Init error:', error);
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapboxToken, onTractClick, loadTractsForViewport]);

  // ==========================================================================
  // LOAD TRACTS WHEN MAP IS READY
  // ==========================================================================
  useEffect(() => {
    if (mapReady && showTracts) {
      // Small delay to ensure everything is settled
      const timer = setTimeout(() => {
        loadTractsForViewport();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mapReady, showTracts, loadTractsForViewport]);

  // ==========================================================================
  // DEAL MARKERS
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !mapReady) return;

    // Clear existing markers
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
        .addTo(map);

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
        popup.addTo(map);
      });
      el.addEventListener('mouseleave', () => popup.remove());

      markersRef.current.set(deal.id, marker);
    });
  }, [deals, selectedDealId, mapReady, onSelectDeal]);

  // ==========================================================================
  // FLY TO SELECTED DEAL
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !selectedDealId) return;
    
    const deal = deals.find(d => d.id === selectedDealId);
    if (!deal) return;
    
    const coords = getCoordinatesForDeal(deal);
    if (!coords) return;
    
    map.flyTo({ center: coords, zoom: 12, duration: 1500 });
  }, [selectedDealId, deals, mapReady]);

  // ==========================================================================
  // FLY TO SEARCH LOCATION
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    const mapboxgl = mapboxModule.current;
    if (!map || !mapboxgl || !mapReady || !centerLocation) return;

    // Remove old search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // Create pulsing marker
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="search-pulse" style="
        width: 24px; height: 24px;
        background: #ef4444; border: 3px solid white; border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>
    `;

    searchMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat(centerLocation)
      .addTo(map);

    map.flyTo({ center: centerLocation, zoom: 12, duration: 1500 });
  }, [centerLocation, mapReady]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

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

      {/* Tract count indicator */}
      {showTracts && currentZoom >= MIN_TRACT_ZOOM && tractCount > 0 && !tractsLoading && (
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
          <span className="text-xs text-orange-400">{tractCount} tracts</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">NMTC Eligibility</p>
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
                <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(124, 58, 237, 0.6)', border: '1px solid #7c3aed' }} />
                <span className="text-xs text-gray-400">Eligible (Distressed)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(220, 38, 38, 0.6)', border: '1px solid #dc2626' }} />
                <span className="text-xs text-gray-400">Eligible (Severe Distress)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(229, 231, 235, 0.2)', border: '1px solid #d1d5db' }} />
                <span className="text-xs text-gray-400">Not Eligible</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
          {deals.length} deals • Zoom {currentZoom.toFixed(0)}
          {showTracts && currentZoom >= MIN_TRACT_ZOOM && tractCount > 0 && (
            <> • {tractCount} tracts</>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {!mapReady && (
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

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface TractData {
  geoid: string;
  eligible: boolean;
  programs: string[];
  povertyRate?: number;
  medianIncomePct?: number;
  geometry?: GeoJSON.Geometry;
}

interface DealPin {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'nmtc' | 'htc' | 'lihtc' | 'oz';
  projectCost?: number;
}

interface HomeMapWithTractsProps {
  height?: string;
  className?: string;
  onTractSelect?: (tract: TractData | null) => void;
  searchedLocation?: { lat: number; lng: number; tract?: string } | null;
}

// Demo deal pins for initial display
const DEMO_DEALS: DealPin[] = [
  { id: 'demo-1', name: 'Community Health Center', coordinates: [-90.1994, 38.6270], type: 'nmtc', projectCost: 12500000 },
  { id: 'demo-2', name: 'Historic Mill Renovation', coordinates: [-90.2194, 38.6170], type: 'htc', projectCost: 8200000 },
  { id: 'demo-3', name: 'Affordable Housing Dev', coordinates: [-90.1794, 38.6370], type: 'lihtc', projectCost: 15000000 },
  { id: 'demo-4', name: 'Innovation Hub', coordinates: [-90.2094, 38.6470], type: 'oz', projectCost: 22000000 },
];

const PIN_COLORS: Record<string, string> = {
  nmtc: '#22c55e',    // green
  htc: '#f59e0b',     // amber
  lihtc: '#3b82f6',   // blue
  oz: '#a855f7',      // purple
  search: '#ef4444',  // red
};

export default function HomeMapWithTracts({
  height = '500px',
  className = '',
  onTractSelect,
  searchedLocation,
}: HomeMapWithTractsProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingTract, setLoadingTract] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const MIN_TRACT_ZOOM = 10;

  // Load tracts for current viewport - direct function that doesn't depend on React state
  const loadTractsForViewportDirect = async () => {
    if (!map.current) {
      console.log('[Tracts] No map ref');
      return;
    }
    
    const zoom = map.current.getZoom();
    console.log(`[Tracts] Current zoom: ${zoom}, MIN_TRACT_ZOOM: ${MIN_TRACT_ZOOM}`);
    if (zoom < MIN_TRACT_ZOOM) {
      console.log('[Tracts] Zoom too low, skipping tract load');
      return;
    }

    setLoadingTract(true);
    
    try {
      const bounds = map.current.getBounds();
      if (!bounds) {
        console.log('[Tracts] No bounds available');
        return;
      }
      
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      console.log(`[Tracts] Fetching tracts for bbox: ${bbox}`);
      
      // Fetch tract geometries
      const geoRes = await fetch(`/api/geo/tracts?bbox=${bbox}&limit=100`);
      if (!geoRes.ok) {
        console.error(`[Tracts] API error: ${geoRes.status}`);
        throw new Error('Failed to fetch tracts');
      }
      
      const geojson = await geoRes.json();
      console.log(`[Tracts] API returned ${geojson.features?.length || 0} features`);
      
      if (!geojson.features?.length) {
        console.log('[Tracts] No features returned, skipping');
        setLoadingTract(false);
        return;
      }
      
      // Enrich with eligibility data (fetch in parallel for up to 20 tracts)
      const tractsToFetch = geojson.features.slice(0, 20);
      const eligibilityPromises = tractsToFetch.map(async (feature: GeoJSON.Feature) => {
        const geoid = feature.properties?.GEOID;
        if (!geoid) return feature;
        
        try {
          const res = await fetch(`/api/eligibility?tract=${geoid}`);
          const data = await res.json();
          
          return {
            ...feature,
            id: geoid,
            properties: {
              ...feature.properties,
              geoid,
              eligible: data.eligible,
              programs: JSON.stringify(data.programs || []),
              povertyRate: data.federal?.poverty_rate?.toFixed(1) || null,
              medianIncomePct: data.federal?.median_income_pct?.toFixed(0) || null,
              stateName: data.location?.state || null,
              countyName: data.location?.county || null,
              severelyDistressed: data.federal?.severely_distressed || false,
            }
          };
        } catch {
          return feature;
        }
      });
      
      const enrichedFeatures = await Promise.all(eligibilityPromises);
      console.log(`[Tracts] Enriched ${enrichedFeatures.length} features with eligibility`);
      
      // Update the map source - wrap in try-catch to prevent Mapbox errors from bubbling
      try {
        const source = map.current?.getSource('tracts') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: enrichedFeatures,
          });
          console.log('[Tracts] ✅ Updated map source with tract features');
        } else {
          console.error('[Tracts] ❌ No tracts source found on map!');
        }
      } catch (mapError) {
        console.warn('[Tracts] Error updating tract source:', mapError);
      }
    } catch (error) {
      console.error('[Tracts] Error loading tracts:', error);
    } finally {
      setLoadingTract(false);
    }
  };

  // Hydration guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isMounted || !mapContainer.current || map.current) return;
    
    if (!mapboxToken) {
      console.warn('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-90.1994, 38.6270], // St. Louis
      zoom: 11,
      minZoom: 3,
      maxZoom: 18,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      if (!map.current) return;

      // Add source for tract polygons (initially empty)
      map.current.addSource('tracts', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Tract fill layer - colored by eligibility
      map.current.addLayer({
        id: 'tract-fills',
        type: 'fill',
        source: 'tracts',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'eligible'], true], 'rgba(34, 197, 94, 0.35)',  // green for eligible
            'rgba(239, 68, 68, 0.25)'  // red for not eligible
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 0.6,
            0.35
          ]
        }
      });

      // Tract outline layer
      map.current.addLayer({
        id: 'tract-outlines',
        type: 'line',
        source: 'tracts',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'eligible'], true], '#22c55e',
            '#ef4444'
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 3,
            2
          ]
        }
      });

      // Hover interaction
      let hoveredStateId: string | number | null = null;

      map.current.on('mousemove', 'tract-fills', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        
        map.current.getCanvas().style.cursor = 'pointer';
        
        if (hoveredStateId !== null) {
          map.current.setFeatureState(
            { source: 'tracts', id: hoveredStateId },
            { hover: false }
          );
        }
        
        hoveredStateId = e.features[0].id ?? null;
        if (hoveredStateId !== null) {
          map.current.setFeatureState(
            { source: 'tracts', id: hoveredStateId },
            { hover: true }
          );
        }

        // Show popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        const props = e.features[0].properties;
        if (!props) return;

        const eligible = props.eligible === true || props.eligible === 'true';
        let programs: string[] = [];
        try {
          programs = props.programs ? JSON.parse(props.programs) : [];
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
                Census Tract: <span style="font-family: monospace; color: #d1d5db; font-weight: 500;">${props.geoid || 'Unknown'}</span>
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
              ${props.povertyRate || props.medianIncomePct ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 10px; border-top: 1px solid #374151; font-size: 12px;">
                  <div>
                    <p style="color: #6b7280; font-size: 10px; margin-bottom: 2px;">Poverty Rate</p>
                    <p style="font-weight: 600; color: ${parseFloat(props.povertyRate) >= 20 ? '#fb923c' : '#d1d5db'};">${props.povertyRate ? props.povertyRate + '%' : 'N/A'}</p>
                  </div>
                  <div>
                    <p style="color: #6b7280; font-size: 10px; margin-bottom: 2px;">Median Income</p>
                    <p style="font-weight: 600; color: ${parseFloat(props.medianIncomePct) <= 80 ? '#fb923c' : '#d1d5db'};">${props.medianIncomePct ? props.medianIncomePct + '% AMI' : 'N/A'}</p>
                  </div>
                </div>
              ` : ''}
              ${props.stateName ? `
                <p style="font-size: 10px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
                  📍 ${props.countyName ? props.countyName + ', ' : ''}${props.stateName}
                </p>
              ` : ''}
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseleave', 'tract-fills', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        
        if (hoveredStateId !== null) {
          map.current.setFeatureState(
            { source: 'tracts', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      // Click to select tract
      map.current.on('click', 'tract-fills', (e) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        if (props?.geoid && onTractSelect) {
          let programs: string[] = [];
          try {
            programs = props.programs ? JSON.parse(props.programs) : [];
          } catch {
            programs = [];
          }
          onTractSelect({
            geoid: props.geoid,
            eligible: props.eligible === true || props.eligible === 'true',
            programs,
            povertyRate: props.povertyRate ? parseFloat(props.povertyRate) : undefined,
            medianIncomePct: props.medianIncomePct ? parseFloat(props.medianIncomePct) : undefined,
          });
        }
      });

      // Add demo deal markers
      addDealMarkers(DEMO_DEALS);
      
      // Load tracts on pan/zoom (debounced)
      let moveendTimeout: NodeJS.Timeout | null = null;
      map.current.on('moveend', () => {
        if (moveendTimeout) clearTimeout(moveendTimeout);
        moveendTimeout = setTimeout(() => {
          loadTractsForViewportDirect();
        }, 300);
      });

      // Load tracts for initial viewport
      console.log('[Map] Map loaded, scheduling initial tract load...');
      setTimeout(() => {
        console.log('[Map] Triggering initial tract load');
        loadTractsForViewportDirect();
      }, 500);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMounted, mapboxToken, onTractSelect]);

  // Add deal markers to map
  const addDealMarkers = useCallback((deals: DealPin[]) => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    deals.forEach((deal) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 18px;
          height: 18px;
          background: ${PIN_COLORS[deal.type]};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="background: #1f2937; color: white; padding: 10px; border-radius: 8px; font-family: system-ui;">
            <p style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${deal.name}</p>
            <p style="font-size: 11px; color: ${PIN_COLORS[deal.type]}; text-transform: uppercase; letter-spacing: 0.5px;">${deal.type}</p>
            ${deal.projectCost ? `<p style="font-size: 12px; color: #9ca3af; margin-top: 6px;">$${(deal.projectCost / 1000000).toFixed(1)}M</p>` : ''}
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(deal.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('mouseenter', () => popup.addTo(map.current!));
      el.addEventListener('mouseleave', () => popup.remove());

      markersRef.current.push(marker);
    });
  }, []);

  // Fetch and display tract when location is searched
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchedLocation) return;

    const { lat, lng, tract } = searchedLocation;

    // Remove existing search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // Add search location marker with pulsing effect
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="search-marker" style="
        width: 24px;
        height: 24px;
        background: ${PIN_COLORS.search};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5), 0 2px 8px rgba(0,0,0,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0), 0 2px 8px rgba(0,0,0,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 2px 8px rgba(0,0,0,0.4); }
        }
      </style>
    `;

    searchMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Fly to location
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1500,
    });

    // Fetch real tract geometry and eligibility
    if (tract) {
      fetchTractData(tract, [lng, lat]);
    } else {
      // If no tract provided, fetch by coordinates
      fetchTractByCoordinates(lng, lat);
    }
  }, [searchedLocation, mapLoaded]);

  // Fetch tract by coordinates (when no GEOID provided)
  const fetchTractByCoordinates = async (lng: number, lat: number) => {
    setLoadingTract(true);
    try {
      // Get tract geometry from Census TIGERweb
      const geoRes = await fetch(`/api/geo/tract-geometry?lat=${lat}&lng=${lng}`);
      const geoData = await geoRes.json();

      if (geoData.found && geoData.geoid) {
        await fetchTractData(geoData.geoid, [lng, lat], geoData.geometry);
      }
    } catch (error) {
      console.error('Error fetching tract by coordinates:', error);
    } finally {
      setLoadingTract(false);
    }
  };

  // Fetch tract geometry from Census TIGERweb and eligibility from our API
  const fetchTractData = async (geoid: string, center: [number, number], existingGeometry?: GeoJSON.Geometry) => {
    if (!map.current) return;
    setLoadingTract(true);

    console.log(`[Map] Fetching tract data for GEOID: ${geoid}`);

    try {
      // Fetch eligibility data from our API
      const eligibilityRes = await fetch(`/api/eligibility?tract=${geoid}`);
      const eligibility = await eligibilityRes.json();
      console.log(`[Map] Eligibility response:`, eligibility);

      // Fetch real tract geometry from Census TIGERweb if not provided
      let geometry = existingGeometry;
      if (!geometry) {
        console.log(`[Map] Fetching geometry from TIGERweb for GEOID: ${geoid}`);
        const geoRes = await fetch(`/api/geo/tract-geometry?geoid=${geoid}`);
        const geoData = await geoRes.json();
        console.log(`[Map] Geometry response:`, geoData);
        
        if (geoData.found && geoData.geometry && geoData.geometry.type && geoData.geometry.coordinates) {
          geometry = geoData.geometry;
          console.log(`[Map] Got real geometry, type: ${geoData.geometry.type}`);
        } else {
          console.warn(`[Map] TIGERweb returned no valid geometry:`, geoData.message || 'Unknown reason');
        }
      } else {
        // Validate existing geometry (check with 'in' operator for TypeScript compatibility)
        if (!existingGeometry?.type || !('coordinates' in existingGeometry)) {
          console.warn('[Map] Provided geometry is invalid, will use fallback');
          geometry = undefined;
        } else {
          console.log(`[Map] Using provided geometry, type: ${existingGeometry?.type}`);
        }
      }

      // If we still don't have valid geometry, create a fallback bounding box
      if (!geometry || !geometry.type || !('coordinates' in geometry)) {
        console.warn('[Map] No valid geometry available, using fallback bounding box');
        const offset = 0.012;
        geometry = {
          type: 'Polygon',
          coordinates: [[
            [center[0] - offset, center[1] - offset],
            [center[0] + offset, center[1] - offset],
            [center[0] + offset, center[1] + offset],
            [center[0] - offset, center[1] + offset],
            [center[0] - offset, center[1] - offset],
          ]]
        };
      }

      // Build the GeoJSON feature with all properties
      const tractFeature: GeoJSON.Feature = {
        type: 'Feature',
        id: geoid,
        properties: {
          geoid,
          name: `Tract ${geoid.slice(-6)}`,
          eligible: eligibility.eligible,
          programs: JSON.stringify(eligibility.programs || []),
          povertyRate: eligibility.federal?.poverty_rate?.toFixed(1) || null,
          medianIncomePct: eligibility.federal?.median_income_pct?.toFixed(0) || null,
          stateName: eligibility.location?.state || null,
          countyName: eligibility.location?.county || null,
          severelyDistressed: eligibility.federal?.severely_distressed || false,
        },
        geometry: geometry as GeoJSON.Geometry,
      };

      // Update the tracts source - wrap in try-catch to prevent Mapbox errors from bubbling
      try {
        const source = map.current.getSource('tracts') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [tractFeature]
          });
        }
      } catch (mapError) {
        console.warn('[Map] Error updating tract source:', mapError);
      }

      // Fit map to tract bounds if we have real geometry
      if (geometry && geometry.type === 'Polygon' && map.current) {
        try {
          const coords = (geometry as GeoJSON.Polygon).coordinates[0];
          if (coords && coords.length > 0) {
            const bounds = coords.reduce(
              (b, coord) => b.extend(coord as [number, number]),
              new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
            );
            map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
          }
        } catch (boundsError) {
          console.warn('[Map] Error fitting bounds:', boundsError);
        }
      }

    } catch (error) {
      console.error('Error fetching tract data:', error);
    } finally {
      setLoadingTract(false);
    }
  };

  // Loading state
  if (!isMounted) {
    return (
      <div 
        className={`rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center p-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div 
        className={`rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center ${className}`} 
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-gray-400 mb-2">Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading overlay for tract fetch */}
      {loadingTract && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gray-900/95 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-300">Loading tract boundary...</span>
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(34, 197, 94, 0.4)', border: '2px solid #22c55e' }} />
            <span className="text-xs text-gray-400">Eligible Tract</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.3)', border: '2px solid #ef4444' }} />
            <span className="text-xs text-gray-400">Not Eligible</span>
          </div>
          <div className="w-full h-px bg-gray-700 my-1.5" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: PIN_COLORS.nmtc, border: '2px solid white' }} />
            <span className="text-xs text-gray-400">NMTC Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: PIN_COLORS.htc, border: '2px solid white' }} />
            <span className="text-xs text-gray-400">HTC Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: PIN_COLORS.oz, border: '2px solid white' }} />
            <span className="text-xs text-gray-400">OZ Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: PIN_COLORS.search, border: '2px solid white' }} />
            <span className="text-xs text-gray-400">Your Search</span>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchDeals } from '@/lib/supabase/queries';
import { Deal } from '@/lib/data/deals';

/**
 * HomeMapWithTracts - THE Community Tax Credit Source of Truth Map
 * =================================================================
 * Uses ONLY local Supabase data - NO external API calls
 * Source of Truth: tract_geometries + master_tax_credit_sot (via tract_map_layer view)
 *
 * Rendering Strategy:
 * - Zoom < 8: Vector tiles for instant full-US rendering (85K+ tracts)
 * - Zoom >= 8: GeoJSON polygons for detailed view with all program data
 *
 * Color Scheme:
 * - Purple (has_any_tax_credit = true): Tract qualifies for at least one program
 * - Gray (has_any_tax_credit = false): Tract has no eligible programs
 * - GREEN/RED: Only shown AFTER address search (green=eligible, red=not eligible)
 *
 * Leveling the playing field - no more old boys network gatekeeping this data.
 */

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
  deals?: Deal[];
  allocations?: any[];
}

const PIN_COLORS: Record<string, string> = {
  nmtc: '#22c55e',
  htc: '#f59e0b',
  lihtc: '#3b82f6',
  oz: '#a855f7',
  search: '#ef4444',
  searchEligible: '#22c55e',
  searchNotEligible: '#ef4444',
};

// Zoom threshold for switching between vector tiles and GeoJSON polygons
const VECTOR_TILE_MAX_ZOOM = 8;

export default function HomeMapWithTracts({
  height = '500px',
  className = '',
  onTractSelect,
  searchedLocation,
  deals: initialDeals,
  allocations,
}: HomeMapWithTractsProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const isLoadingTracts = useRef(false);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingTract, setLoadingTract] = useState(false);
  const [tractCount, setTractCount] = useState(0);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Hydration guard
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load tracts for current viewport
  // Strategy:
  // - Zoom < VECTOR_TILE_MAX_ZOOM: Vector tiles handle rendering (fast full-US)
  // - Zoom >= VECTOR_TILE_MAX_ZOOM: Load GeoJSON for detailed program data
  const loadTractsForViewport = useCallback(async () => {
    if (!map.current || isLoadingTracts.current) return;

    const zoom = map.current.getZoom();
    const bounds = map.current.getBounds();
    if (!bounds) return;

    // At low zoom, vector tiles handle everything - no GeoJSON needed
    if (zoom < VECTOR_TILE_MAX_ZOOM) {
      // Clear GeoJSON source when using vector tiles
      const polySource = map.current.getSource('tract-polygons') as mapboxgl.GeoJSONSource;
      if (polySource) {
        polySource.setData({ type: 'FeatureCollection', features: [] });
      }
      setTractCount(0);
      console.log(`[Map] Zoom ${zoom.toFixed(1)} < ${VECTOR_TILE_MAX_ZOOM} - using vector tiles`);
      return;
    }

    isLoadingTracts.current = true;

    try {
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      const url = `/api/map/tracts?bbox=${bbox}`;

      console.log(`[Map] Loading GeoJSON polygons for zoom ${zoom.toFixed(1)}`);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tracts');

      const geojson = await response.json();

      if (!map.current) return;

      // Update polygon source
      const polySource = map.current.getSource('tract-polygons') as mapboxgl.GeoJSONSource;
      if (polySource) {
        polySource.setData(geojson);
      }

      setTractCount(geojson.features?.length || 0);
      console.log(`[Map] Loaded ${geojson.features?.length || 0} tracts (${geojson.mode || 'unknown'} mode)`);

    } catch (error) {
      console.error('[Map] Error loading tracts:', error);
    } finally {
      isLoadingTracts.current = false;
    }
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
      center: [-98.5795, 39.8283],
      zoom: 4,
      minZoom: 3,
      maxZoom: 18,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      if (!map.current) return;

      // =================================================================
      // VECTOR TILE SOURCE - Fast full-US rendering at low zoom
      // =================================================================
      map.current.addSource('tract-tiles', {
        type: 'vector',
        tiles: [
          `${window.location.origin}/api/tiles/{z}/{x}/{y}`
        ],
        minzoom: 0,
        maxzoom: 14,
      });

      // Layer: Vector tile fills (low zoom - purple=eligible, gray=not)
      map.current.addLayer({
        id: 'tract-tile-fills',
        type: 'fill',
        source: 'tract-tiles',
        'source-layer': 'tracts',
        maxzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'e'], 1], '#a855f7',  // Purple for eligible
            '#6b7280'                             // Gray for not eligible
          ],
          'fill-opacity': 0.5
        }
      });

      // Layer: Vector tile outlines
      map.current.addLayer({
        id: 'tract-tile-outlines',
        type: 'line',
        source: 'tract-tiles',
        'source-layer': 'tracts',
        maxzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'e'], 1], '#7c3aed',  // Dark purple
            '#4b5563'                             // Dark gray
          ],
          'line-width': 0.5,
          'line-opacity': 0.6
        }
      });

      // =================================================================
      // GEOJSON SOURCE - Detailed view at high zoom
      // =================================================================
      map.current.addSource('tract-polygons', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Source for searched/highlighted tract
      map.current.addSource('searched-tract', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Layer: GeoJSON polygon fills (high zoom - purple=eligible, gray=not)
      // Same simple two-color scheme as vector tiles
      map.current.addLayer({
        id: 'tract-polygon-fills',
        type: 'fill',
        source: 'tract-polygons',
        minzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'has_any_tax_credit'], true], '#a855f7',  // Purple for eligible
            '#6b7280'                                                  // Gray for not eligible
          ],
          'fill-opacity': 0.5
        }
      });

      // Layer: GeoJSON polygon outlines
      map.current.addLayer({
        id: 'tract-polygon-outlines',
        type: 'line',
        source: 'tract-polygons',
        minzoom: VECTOR_TILE_MAX_ZOOM,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'has_any_tax_credit'], true], '#7c3aed',  // Dark purple
            '#4b5563'                                                  // Dark gray
          ],
          'line-width': 1,
          'line-opacity': 0.8
        }
      });

      // Layer: Searched tract highlight
      map.current.addLayer({
        id: 'searched-tract-fill',
        type: 'fill',
        source: 'searched-tract',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'has_any_tax_credit'], true], '#22c55e',
            '#ef4444'
          ],
          'fill-opacity': 0.7
        }
      });

      map.current.addLayer({
        id: 'searched-tract-outline',
        type: 'line',
        source: 'searched-tract',
        paint: {
          'line-color': '#ffffff',
          'line-width': 3
        }
      });

      // Hover popup for vector tiles (low zoom)
      map.current.on('mousemove', 'tract-tile-fills', (e) => {
        if (!map.current || !e.features?.[0]) return;
        map.current.getCanvas().style.cursor = 'pointer';

        if (popupRef.current) popupRef.current.remove();

        const props = e.features[0].properties;
        if (!props) return;

        const eligible = props.e === 1;
        const stackScore = props.s || 0;

        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background: #1f2937; color: white; padding: 10px; border-radius: 8px; font-family: system-ui; min-width: 160px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 14px;">${eligible ? '✓' : '✗'}</span>
                <span style="font-weight: 600; font-size: 13px; color: ${eligible ? '#a78bfa' : '#9ca3af'};">
                  ${eligible ? 'Has Tax Credits' : 'Not Eligible'}
                </span>
              </div>
              <p style="font-size: 11px; color: #9ca3af;">
                Tract: <span style="font-family: monospace; color: #d1d5db;">${props.geoid}</span>
              </p>
              ${stackScore > 0 ? `
                <p style="font-size: 10px; color: #a78bfa; margin-top: 4px;">
                  ${stackScore} program${stackScore > 1 ? 's' : ''} available
                </p>
              ` : ''}
              <p style="font-size: 9px; color: #6b7280; margin-top: 6px;">
                Zoom in for details
              </p>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseleave', 'tract-tile-fills', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      // Hover popup for GeoJSON polygons (high zoom - detailed info)
      map.current.on('mousemove', 'tract-polygon-fills', (e) => {
        if (!map.current || !e.features?.[0]) return;
        map.current.getCanvas().style.cursor = 'pointer';

        if (popupRef.current) popupRef.current.remove();

        const props = e.features[0].properties;
        if (!props) return;

        const eligible = props.has_any_tax_credit === true || props.has_any_tax_credit === 'true';
        let programs: string[] = [];
        try {
          programs = props.programs ? JSON.parse(props.programs) : [];
        } catch { /* ignore */ }

        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 15,
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background: #1f2937; color: white; padding: 12px; border-radius: 8px; font-family: system-ui; min-width: 180px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 16px;">${eligible ? '✓' : '✗'}</span>
                <span style="font-weight: 600; font-size: 14px; color: ${eligible ? '#a78bfa' : '#9ca3af'};">
                  ${eligible ? 'Tax Credit Eligible' : 'Not Eligible'}
                </span>
              </div>
              <p style="font-size: 12px; color: #9ca3af; margin-bottom: 6px;">
                Tract: <span style="font-family: monospace; color: #d1d5db;">${props.geoid || props.GEOID}</span>
              </p>
              ${programs.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                  ${programs.map((p: string) => `
                    <span style="padding: 2px 6px; font-size: 10px; background: rgba(124, 58, 237, 0.2); color: #a78bfa; border-radius: 4px;">${p}</span>
                  `).join('')}
                </div>
              ` : ''}
              ${props.poverty_rate ? `
                <div style="font-size: 11px; color: #9ca3af;">
                  Poverty: ${props.poverty_rate}% | MFI: ${props.mfi_pct || 'N/A'}%
                </div>
              ` : ''}
              ${props.state_name ? `
                <p style="font-size: 10px; color: #6b7280; margin-top: 6px;">
                  ${props.county_name ? props.county_name + ', ' : ''}${props.state_name}
                </p>
              ` : ''}
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseleave', 'tract-polygon-fills', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      });

      // Click to select tract
      map.current.on('click', 'tract-polygon-fills', (e) => {
        const props = e.features?.[0]?.properties;
        if (props?.geoid && onTractSelect) {
          let programs: string[] = [];
          try {
            programs = props.programs ? JSON.parse(props.programs) : [];
          } catch { /* ignore */ }

          onTractSelect({
            geoid: props.geoid,
            eligible: props.eligible === true || props.eligible === 'true',
            programs,
            povertyRate: props.poverty_rate,
            medianIncomePct: props.mfi_pct,
          });
        }
      });

      // Load tracts on map move (debounced)
      let moveTimeout: NodeJS.Timeout | null = null;
      map.current.on('moveend', () => {
        if (moveTimeout) clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
          loadTractsForViewport();
        }, 300);
      });

      // Initial load
      loadTractsForViewport();

      // Add deal markers
      if (initialDeals && initialDeals.length > 0) {
        addDealMarkers(initialDeals);
      } else {
        fetchDeals().then(addDealMarkers).catch(console.error);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMounted, mapboxToken, loadTractsForViewport, onTractSelect, initialDeals]);

  // Add deal markers
  const addDealMarkers = useCallback((deals: Deal[]) => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const pins: DealPin[] = deals
      .filter(d => d.coordinates)
      .map(d => ({
        id: d.id,
        name: d.projectName,
        coordinates: d.coordinates!,
        type: d.programType.toLowerCase() as any,
        projectCost: d.projectCost || d.allocation * 5
      }));

    pins.forEach((deal) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 18px; height: 18px;
          background: ${PIN_COLORS[deal.type] || PIN_COLORS.search};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `;
      const marker = new mapboxgl.Marker(el)
        .setLngLat(deal.coordinates)
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, []);

  // Handle searched location
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchedLocation) return;

    const { lat, lng, tract } = searchedLocation;

    map.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1500 });

    if (searchMarkerRef.current) searchMarkerRef.current.remove();

    const el = document.createElement('div');
    el.innerHTML = `<div style="width:24px;height:24px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(99,102,241,0.3);"></div>`;

    searchMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Fetch and highlight the searched tract
    const fetchSearchedTract = async () => {
      setLoadingTract(true);
      try {
        const url = tract
          ? `/api/map/tracts?geoid=${tract}`
          : `/api/map/tracts?lat=${lat}&lng=${lng}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.features?.length > 0 && map.current) {
          const source = map.current.getSource('searched-tract') as mapboxgl.GeoJSONSource;
          if (source) {
            source.setData(data);
          }
        }
      } catch (e) {
        console.error('[Map] Error fetching searched tract:', e);
      } finally {
        setLoadingTract(false);
      }
    };

    fetchSearchedTract();
  }, [searchedLocation, mapLoaded]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Tract count */}
      {mapLoaded && tractCount > 0 && (
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg px-3 py-2 border border-gray-700 z-10">
          <span className="text-xs text-purple-400">{tractCount} tracts</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 rounded-lg p-3 border border-gray-700 z-10">
        <p className="text-xs font-semibold text-gray-300 mb-2">Census Tract Eligibility</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(168, 85, 247, 0.6)', border: '1px solid #a855f7' }} />
            <span className="text-xs text-gray-400">Has Tax Credits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(107, 114, 128, 0.6)', border: '1px solid #6b7280' }} />
            <span className="text-xs text-gray-400">Not Eligible</span>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-2 pt-2">
          <p className="text-[10px] text-gray-500 mb-1">After Address Search:</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(34, 197, 94, 0.7)', border: '1px solid #22c55e' }} />
            <span className="text-xs text-gray-400">Eligible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239, 68, 68, 0.7)', border: '1px solid #ef4444' }} />
            <span className="text-xs text-gray-400">Not Eligible</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchDeals } from '@/lib/supabase/queries';

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

const PIN_COLORS: Record<string, string> = {
  nmtc: '#22c55e',    // green
  htc: '#f59e0b',     // amber
  lihtc: '#3b82f6',   // blue
  oz: '#a855f7',      // purple
  search: '#ef4444',  // red (default)
  searchEligible: '#22c55e',    // green for eligible tract
  searchNotEligible: '#ef4444', // red for not eligible
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
  const tractFeaturesRef = useRef<GeoJSON.Feature[]>([]);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingTract, setLoadingTract] = useState(false);
  const [searchEligible, setSearchEligible] = useState<boolean | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Load ALL tracts on init - no zoom restriction
  const loadAllTracts = async () => {
    if (!map.current) {
      console.log('[Tracts] No map ref');
      return;
    }

    const source = map.current.getSource('tracts');
    if (!source) {
      console.log('[Tracts] Source not ready, skipping load');
      return;
    }

    setLoadingTract(true);
    console.log('[Tracts] Loading ALL tracts for entire US...');
    
    try {
      // Fetch ALL tracts - no bbox, high limit
      const geoRes = await fetch(`/api/tracts/geojson?limit=100000`);
      if (!geoRes.ok) {
        console.error(`[Tracts] API error: ${geoRes.status}`);
        throw new Error('Failed to fetch tracts');
      }
      
      const geojson = await geoRes.json();
      console.log(`[Tracts] API returned ${geojson.features?.length || 0} features`);
      
      if (!geojson.features?.length) {
        console.log('[Tracts] No features returned');
        setLoadingTract(false);
        return;
      }
      
      // Add IDs for feature state
      const features = geojson.features.map((feature: GeoJSON.Feature) => ({
        ...feature,
        id: feature.properties?.geoid || `tract-${Math.random()}`,
      }));
      
      // Store features for later updates
      tractFeaturesRef.current = features;
      
      // Update the map source
      try {
        const tractsSource = map.current?.getSource('tracts') as mapboxgl.GeoJSONSource;
        tractsSource.setData({
          type: 'FeatureCollection',
          features,
        });
        console.log(`[Tracts] Loaded ${features.length} tracts`);
      } catch (sourceErr) {
        console.warn('[Tracts] Source update error:', sourceErr);
      }
    } catch (error) {
      console.error('[Tracts] Failed to load tracts:', error);
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
      center: [-98.5795, 39.8283], // Center of continental US
      zoom: 7,  // Zoom in enough to show tracts
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
        },
        promoteId: 'geoid'  // Use geoid property as feature ID for feature-state
      });

      // Tract fill layer - simple: eligible or not
      map.current.addLayer({
        id: 'tract-fills',
        type: 'fill',
        source: 'tracts',
        paint: {
          'fill-color': [
            'case',
            // Searched tract - GREEN if eligible, RED if not
            ['==', ['get', 'searched'], true],
            [
              'case',
              ['any',
                ['==', ['get', 'nmtc_lic'], true],
                ['==', ['get', 'lihtc_qct'], true],
                ['==', ['get', 'oz'], true],
                ['==', ['get', 'eligible'], true]
              ],
              '#22c55e', // Green - qualifies
              '#ef4444'  // Red - doesn't qualify
            ],
            // Normal tracts - Purple if eligible, Gray if not
            ['any',
              ['==', ['get', 'nmtc_lic'], true],
              ['==', ['get', 'lihtc_qct'], true],
              ['==', ['get', 'oz'], true],
              ['==', ['get', 'eligible'], true]
            ],
            '#7C3AED', // Purple - qualifies
            '#6B7280'  // Gray - doesn't qualify
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'searched'], true], 0.85,
            ['boolean', ['feature-state', 'hover'], false], 0.7,
            0.5
          ]
        }
      });

      // Tract outline layer - simple
      map.current.addLayer({
        id: 'tract-outlines',
        type: 'line',
        source: 'tracts',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'searched'], true], '#22c55e',
            '#FFFFFF'
          ],
          'line-width': [
            'case',
            ['==', ['get', 'searched'], true], 3,
            ['boolean', ['feature-state', 'hover'], false], 2,
            0.5
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

        console.log('[Hover] Props:', props); // Debug

        // Helper to check boolean values (handles true, 'true', 1, '1')
        const isTruthy = (val: unknown): boolean => {
          return val === true || val === 'true' || val === 1 || val === '1';
        };

        // Handle both searched tract format AND viewport tract format
        const eligible = isTruthy(props.eligible) || isTruthy(props.nmtc_lic) || isTruthy(props.lihtc_qct) || isTruthy(props.oz);
        
        // Build programs list from individual flags
        const programs: string[] = [];
        if (isTruthy(props.nmtc_lic)) programs.push('Federal NMTC');
        if (isTruthy(props.lihtc_qct)) programs.push('LIHTC QCT');
        if (isTruthy(props.oz)) programs.push('Opportunity Zone');
        
        // Also check if programs is a string (from searched tract)
        if (props.programs && typeof props.programs === 'string') {
          try {
            const parsed = JSON.parse(props.programs);
            parsed.forEach((p: string) => {
              if (!programs.includes(p)) programs.push(p);
            });
          } catch {}
        }
        
        const povertyRate = props.povertyRate || props.poverty_rate;
        const medianIncome = props.medianIncomePct || props.mfi_pct;
        
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
                  ${eligible ? 'Eligible' : 'Not Eligible'}
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
                      background: ${p.includes('NMTC') ? 'rgba(34, 197, 94, 0.2)' : p.includes('Opportunity') || p.includes('OZ') ? 'rgba(168, 85, 247, 0.2)' : p.includes('Distressed') ? 'rgba(249, 115, 22, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
                      color: ${p.includes('NMTC') ? '#4ade80' : p.includes('Opportunity') || p.includes('OZ') ? '#c084fc' : p.includes('Distressed') ? '#fb923c' : '#60a5fa'};
                    ">${p}</span>
                  `).join('')}
                </div>
              ` : ''}
              ${povertyRate || medianIncome ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 10px; border-top: 1px solid #374151; font-size: 12px;">
                  <div>
                    <p style="color: #6b7280; font-size: 10px; margin-bottom: 2px;">Poverty Rate</p>
                    <p style="font-weight: 600; color: ${parseFloat(povertyRate) >= 20 ? '#fb923c' : '#d1d5db'};">${povertyRate ? povertyRate + '%' : 'N/A'}</p>
                  </div>
                  <div>
                    <p style="color: #6b7280; font-size: 10px; margin-bottom: 2px;">Median Income</p>
                    <p style="font-weight: 600; color: ${parseFloat(medianIncome) <= 80 ? '#fb923c' : '#d1d5db'};">${medianIncome ? medianIncome + '% AMI' : 'N/A'}</p>
                  </div>
                </div>
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

      // Add deal markers from Supabase
      fetchDeals().then(deals => {
        const pins: DealPin[] = deals.map(d => ({
          id: d.id,
          name: d.projectName,
          coordinates: [-87.6298, 41.8781], // Default to Chicago for now if no coords
          type: d.programType.toLowerCase() as any,
          projectCost: d.allocation * 5
        }));
        addDealMarkers(pins);
      }).catch(err => console.error('Failed to load deal pins:', err));
      
      // Load ALL tracts once on init - no need to reload on pan/zoom
      console.log('[Map] Map loaded, loading all US tracts...');
      setTimeout(() => {
        loadAllTracts();
      }, 300);
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

    // Reset eligibility state for new search
    setSearchEligible(null);

    // Remove existing search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // Add search location marker with pulsing effect (starts indigo while loading)
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="search-marker" style="
        width: 24px;
        height: 24px;
        background: #6366f1;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3), 0 2px 8px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
        transition: background 0.3s ease, box-shadow 0.3s ease;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5), 0 2px 8px rgba(0,0,0,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0), 0 2px 8px rgba(0,0,0,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0), 0 2px 8px rgba(0,0,0,0.4); }
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

  // Update search marker color when eligibility changes
  useEffect(() => {
    if (searchMarkerRef.current && searchEligible !== null) {
      const color = searchEligible ? PIN_COLORS.searchEligible : PIN_COLORS.searchNotEligible;
      const el = searchMarkerRef.current.getElement();
      if (el) {
        const innerDiv = el.querySelector('.search-marker') as HTMLElement;
        if (innerDiv) {
          innerDiv.style.background = color;
          innerDiv.style.boxShadow = `0 0 0 4px ${searchEligible ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}, 0 2px 8px rgba(0,0,0,0.4)`;
        }
      }
    }
  }, [searchEligible]);

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

    console.log(`[Map] Fetching eligibility for GEOID: ${geoid}`);

    try {
      // Fetch eligibility data from our API
      const eligibilityRes = await fetch(`/api/eligibility?tract=${geoid}`);
      const eligibility = await eligibilityRes.json();
      console.log(`[Map] Eligibility response:`, eligibility);
      
      // Update search marker color based on eligibility
      setSearchEligible(eligibility.eligible);

      // Update the existing tract in the source to mark it as searched
      const source = map.current.getSource('tracts') as mapboxgl.GeoJSONSource;
      if (source && tractFeaturesRef.current.length > 0) {
        // Normalize GEOID to handle format differences (leading zeros)
        const normalizeGeoid = (g: string | number | undefined): string => {
          if (!g) return '';
          return String(g).padStart(11, '0');
        };
        
        const searchGeoid = normalizeGeoid(geoid);
        console.log(`[Map] Looking for tract with normalized GEOID: ${searchGeoid}`);
        
        // Clear previous searched flag and set new one
        let foundMatch = false;
        const updatedFeatures = tractFeaturesRef.current.map((f: GeoJSON.Feature) => {
          const fGeoid = normalizeGeoid(f.properties?.geoid || f.id);
          const isSearched = fGeoid === searchGeoid;
          
          if (isSearched) {
            foundMatch = true;
            console.log(`[Map] Found matching tract: ${f.properties?.geoid}`);
          }
          
          return {
            ...f,
            properties: {
              ...f.properties,
              searched: isSearched,
              // Add eligibility data to searched tract
              ...(isSearched ? {
                eligible: eligibility.eligible,
                programs: JSON.stringify(eligibility.programs || []),
                povertyRate: eligibility.federal?.poverty_rate?.toFixed(1) || null,
                medianIncomePct: eligibility.federal?.median_income_pct?.toFixed(0) || null,
              } : {})
            }
          };
        });
        
        // Update the ref with new features
        tractFeaturesRef.current = updatedFeatures;
        
        source.setData({
          type: 'FeatureCollection',
          features: updatedFeatures,
        });
        
        if (foundMatch) {
          console.log(`[Map] ✓ Marked tract ${geoid} as searched - will show ${eligibility.eligible ? 'GREEN' : 'RED'}`);
        } else {
          console.warn(`[Map] ✗ No matching tract found for GEOID ${geoid} (normalized: ${searchGeoid})`);
          // Log sample GEOIDs from features for debugging
          const sampleGeoids = tractFeaturesRef.current.slice(0, 5).map(f => f.properties?.geoid);
          console.log(`[Map] Sample feature GEOIDs:`, sampleGeoids);
        }
      }

      // Fly to the searched location
      map.current.flyTo({
        center: center,
        zoom: 13,
        duration: 1500,
      });

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
      
      {/* Legend - Simple */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 rounded-lg px-3 py-2 border border-gray-700 z-10">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#7C3AED' }} />
            <span className="text-gray-300">Eligible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#6B7280' }} />
            <span className="text-gray-300">Not Eligible</span>
          </div>
          <div className="w-px h-4 bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#22c55e' }} />
            <span className="text-gray-300">Your Search ✓</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} />
            <span className="text-gray-300">Your Search ✗</span>
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

import React, { useEffect, useRef, useState } from "react";
import PlusIcon from "./icons/PlusIcon";
import MinusIcon from "./icons/MinusIcon";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MarkerData {
    coords: [number, number]; // [lat, lon]
    label: string;
}

interface MapViewProps {
    cityCoords: CityCoordinates;
    currentRouteData?: RouteData;
    routeStatus: string;
    markers?: MarkerData[];
    windDeg?: number;
    windSpeed?: string;
    windDirection?: string;
}

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus, markers, windDeg, windSpeed, windDirection }) => {
    const [rotation, setRotation] = useState(0);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: 'https://tiles.versatiles.org/assets/styles/graybeard/style.json',
            center: [cityCoords.lon, cityCoords.lat],
            zoom: 11,
            attributionControl: {
                compact: true
            },
            cooperativeGestures: true
        });

        map.on('rotate', () => {
            setRotation(map.getBearing());
        });

        mapInstanceRef.current = map;

        return () => {
            map.remove();
        };
    }, []); // Run once

    // Update View (Center/Zoom) when no route
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || currentRouteData) return;

        if (routeStatus !== "Поиск...") {
            map.flyTo({
                center: [cityCoords.lon, cityCoords.lat],
                zoom: 11,
                duration: 500
            });
        }
    }, [cityCoords, routeStatus, currentRouteData]);

    // Handle Route (Polyline) and Endpoints (A/B)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const setupRoute = () => {
            const hasData = currentRouteData?.points?.length && currentRouteData.points.length > 0;
            const coordinates = hasData 
                ? currentRouteData!.points.map(([lat, lon]) => [lon, lat]) 
                : [];

            // 1. Route Line
            const geoJson = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                }
            };

            const source = map.getSource('route') as maplibregl.GeoJSONSource;

            if (source) {
                source.setData(geoJson as any);
            } else {
                if (hasData) {
                    map.addSource('route', {
                        type: 'geojson',
                        data: geoJson as any
                    });
                }
            }

            if (hasData) {
                if (!map.getLayer('route')) {
                    if (map.getSource('route')) {
                        map.addLayer({
                            id: 'route',
                            type: 'line',
                            source: 'route',
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            paint: {
                                'line-color': '#444444',
                                'line-width': 3
                            }
                        });
                    }
                }
            }

            // 2. Endpoints (A/B) using Layers
            const endpointsFeatures: any[] = [];
            if (hasData) {
                 endpointsFeatures.push({
                     type: 'Feature',
                     properties: { label: 'A' },
                     geometry: { type: 'Point', coordinates: [currentRouteData!.points[0][1], currentRouteData!.points[0][0]] }
                 });
                 endpointsFeatures.push({
                     type: 'Feature',
                     properties: { label: 'B' },
                     geometry: { type: 'Point', coordinates: [currentRouteData!.points[currentRouteData!.points.length-1][1], currentRouteData!.points[currentRouteData!.points.length-1][0]] }
                 });
            }
            const endpointsGeoJson = { type: 'FeatureCollection', features: endpointsFeatures };
            
            const endpointsSource = map.getSource('endpoints') as maplibregl.GeoJSONSource;
            if (endpointsSource) {
                endpointsSource.setData(endpointsGeoJson as any);
            } else {
                if (hasData) {
                     map.addSource('endpoints', { type: 'geojson', data: endpointsGeoJson as any });
                }
            }

            if (hasData) {
                // Background Circle
                if (!map.getLayer('endpoints-bg')) {
                     if (map.getSource('endpoints')) {
                        map.addLayer({
                            id: 'endpoints-bg',
                            type: 'circle',
                            source: 'endpoints',
                            paint: {
                                'circle-radius': 10,
                                'circle-color': '#444444',
                                'circle-stroke-width': 1,
                                'circle-stroke-color': '#ffffff'
                            }
                        });
                     }
                }
                // Label
                if (!map.getLayer('endpoints-label')) {
                     if (map.getSource('endpoints')) {
                        map.addLayer({
                            id: 'endpoints-label',
                            type: 'symbol',
                            source: 'endpoints',
                            layout: {
                                'text-field': ['get', 'label'],
                                'text-size': 10,
                                'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular', 'Open Sans Regular'],
                                'text-justify': 'center',
                                'text-anchor': 'center'
                            },
                            paint: {
                                'text-color': '#ffffff'
                            }
                        });
                     }
                }

                // Fit bounds
                const bounds = new maplibregl.LngLatBounds();
                coordinates.forEach(coord => bounds.extend(coord as [number, number]));
                
                const padding = 60;

                map.fitBounds(bounds, {
                    padding: padding,
                    duration: 500
                });
            }
        };

        if (map.loaded()) {
            setupRoute();
        } else {
            map.on('load', setupRoute);
        }

        return () => {
            map.off('load', setupRoute);
        };
    }, [currentRouteData]);

    const markersRef = useRef<{ custom: maplibregl.Marker[] }>({ custom: [] });

    // Handle Custom Markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const updateCustomMarkers = () => {
             // Custom Markers (Full rebuild)
             markersRef.current.custom.forEach(m => m.remove());
             markersRef.current.custom = [];

             markers?.forEach(m => {
                const el = document.createElement('div');
                el.style.cssText = "background-color: white; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap; font-size: 11px; font-weight: bold; color: black; font-family: sans-serif; margin-bottom: 4px;";
                el.innerText = m.label;
                const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([m.coords[1], m.coords[0]])
                    .addTo(map);
                markersRef.current.custom.push(marker);
            });
        };

        if (map.loaded()) {
            updateCustomMarkers();
        } else {
            map.on('load', updateCustomMarkers);
        }

        return () => {
            map.off('load', updateCustomMarkers);
        };
    }, [markers]);

    const getAverageWindSpeed = (range?: string) => {
        if (!range) return "";
        const parts = range.split("..");
        if (parts.length === 2) {
            const min = parseInt(parts[0], 10);
            const max = parseInt(parts[1], 10);
            const avg = Math.round((min + max) / 2);
            return `${avg} км/ч`;
        }
        return `${range} км/ч`;
    };

    return (
        <div className="relative w-full aspect-[3/2] bg-slate-100 z-0 rounded-lg overflow-hidden">
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%", filter: "grayscale(100%)" }} />
            
            {!currentRouteData && routeStatus && routeStatus !== "Поиск..." && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                        <p className="text-xs font-bold text-center text-[#1E1E1E]">
                            {routeStatus}
                        </p>
                    </div>
                </div>
            )}

            <div className="absolute left-4 top-4 bottom-4 z-20 flex flex-col items-center justify-between py-2">
                {/* Zoom Controls */}
                <div className="flex flex-col gap-2">
                    <button
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:bg-gray-100 transition-colors"
                        onClick={() => {
                            const map = mapInstanceRef.current;
                            if (map) {
                                map.zoomIn();
                            }
                        }}
                    >
                        <PlusIcon width={20} height={20} />
                    </button>
                    <button
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:bg-gray-100 transition-colors"
                        onClick={() => {
                            const map = mapInstanceRef.current;
                            if (map) {
                                map.zoomOut();
                            }
                        }}
                    >
                        <MinusIcon width={20} height={20} />
                    </button>
                </div>

                {/* Wind Control */}
                {windDeg !== undefined && (
                    <div className="flex flex-col items-center gap-1">
                        <button 
                            className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center shadow-md active:bg-white transition-colors"
                            title="Центрировать маршрут"
                            onClick={() => {
                                const map = mapInstanceRef.current;
                                if (!map) return;
                                
                                map.easeTo({ bearing: 0, duration: 350 });
                                
                                if (currentRouteData?.points?.length) {
                                    const coordinates = currentRouteData.points.map(([lat, lon]) => [lon, lat]);
                                    const bounds = new maplibregl.LngLatBounds();
                                    coordinates.forEach(coord => bounds.extend(coord as [number, number]));
                                    
                                    const padding = 60;

                                    map.fitBounds(bounds, {
                                        padding: padding,
                                        duration: 500
                                    });
                                } else {
                                    map.flyTo({
                                        center: [cityCoords.lon, cityCoords.lat],
                                        zoom: 11,
                                        duration: 500
                                    });
                                }
                            }}
                        >
                            <svg 
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill="#777777" 
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: `rotate(${windDeg + 180 + rotation}deg)` }}
                            >
                                <path d="M12 2L4.5 20.29C4.24 20.92 4.89 21.57 5.53 21.34L12 19L18.47 21.34C19.11 21.57 19.76 20.92 19.5 20.29L12 2Z" />
                            </svg>
                        </button>
                        {(windSpeed || windDirection) && (
                            <div className="flex flex-col items-center">
                                {windSpeed && (
                                    <span className="text-[13px] text-[#444444] font-sans leading-none mb-0.5">
                                        {getAverageWindSpeed(windSpeed)}
                                    </span>
                                )}
                                {windDirection && (
                                    <span className="text-[11px] text-[#444444] uppercase font-sans leading-none">
                                        {windDirection}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

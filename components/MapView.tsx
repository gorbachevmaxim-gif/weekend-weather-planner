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

    // Handle Route (Polyline)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const setupRoute = () => {
            const hasData = currentRouteData?.points?.length && currentRouteData.points.length > 0;
            const coordinates = hasData 
                ? currentRouteData!.points.map(([lat, lon]) => [lon, lat]) 
                : [];

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

    const markersRef = useRef<{ a?: maplibregl.Marker, b?: maplibregl.Marker, custom: maplibregl.Marker[] }>({ custom: [] });

    // Handle Markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const updateMarkers = () => {
            const hasData = currentRouteData?.points?.length && currentRouteData.points.length > 0;

            // Route Start (A)
            if (hasData) {
                const [lat, lon] = currentRouteData!.points[0];
                if (markersRef.current.a) {
                    markersRef.current.a.setLngLat([lon, lat]);
                } else {
                    const el = document.createElement('div');
                    el.className = 'marker-a';
                    el.style.cssText = "display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #444444; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);";
                    el.innerText = 'A';
                    markersRef.current.a = new maplibregl.Marker({ element: el })
                        .setLngLat([lon, lat])
                        .addTo(map);
                }
            } else {
                if (markersRef.current.a) {
                    markersRef.current.a.remove();
                    markersRef.current.a = undefined;
                }
            }

            // Route End (B)
            if (hasData) {
                const [lat, lon] = currentRouteData!.points[currentRouteData!.points.length - 1];
                if (markersRef.current.b) {
                    markersRef.current.b.setLngLat([lon, lat]);
                } else {
                    const el = document.createElement('div');
                    el.className = 'marker-b';
                    el.style.cssText = "display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #444444; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);";
                    el.innerText = 'B';
                    markersRef.current.b = new maplibregl.Marker({ element: el })
                        .setLngLat([lon, lat])
                        .addTo(map);
                }
            } else {
                if (markersRef.current.b) {
                    markersRef.current.b.remove();
                    markersRef.current.b = undefined;
                }
            }

            // Custom Markers (Full rebuild is okay as they don't change often)
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
            updateMarkers();
        } else {
            map.on('load', updateMarkers);
        }

        return () => {
            map.off('load', updateMarkers);
        };
    }, [currentRouteData, markers]);

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

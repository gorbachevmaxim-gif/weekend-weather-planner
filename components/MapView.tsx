import React, { useEffect, useRef, useState } from "react";
import PlusIcon from "./icons/PlusIcon";
import MinusIcon from "./icons/MinusIcon";
import ArrowUp from "./icons/ArrowUp";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import { Style, Stroke } from "ol/style";
import Overlay from "ol/Overlay";
import { defaults as defaultInteractions, DragPan } from 'ol/interaction';

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
    const mapInstanceRef = useRef<Map | null>(null);
    const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
    const overlaysRef = useRef<Overlay[]>([]);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Disable interactions to match previous behavior (map.disable('drag'))
        // We'll allow none for a static map feel, or minimal if needed.
        // Previous code had: disable 'drag', kept others default (though 2GIS defaults might differ).
        // Let's disable dragPan and mouseWheelZoom to be safe/similar.
        const isMobile = window.innerWidth < 768;
        const interactions = defaultInteractions({
            dragPan: !isMobile, // Will be handled by dragPan interaction below if mobile
            mouseWheelZoom: !isMobile,
            doubleClickZoom: true,
            shiftDragZoom: true,
            pinchRotate: true,
            pinchZoom: true,
            altShiftDragRotate: true,
            keyboard: false
        });

        const map = new Map({
            target: mapContainerRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            view: new View({
                center: fromLonLat([cityCoords.lon, cityCoords.lat]),
                zoom: 11,
            }),
            controls: [], // No default controls
            interactions: interactions,
        });

        // For mobile, enable dragPan only with two fingers
        if (isMobile) {
            const dragPan = map.getInteractions().getArray().find(i => i instanceof DragPan);
            if (dragPan) {
                (dragPan as any).setCondition((event: any) => {
                    return event.originalEvent.touches?.length === 2;
                });
            }
        }

        map.getView().on('change:rotation', () => {
            setRotation(map.getView().getRotation());
        });

        mapInstanceRef.current = map;

        return () => {
            map.setTarget(undefined);
        };
    }, []); // Run once

    // Update View (Center/Zoom) when no route
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || currentRouteData) return;

        if (routeStatus !== "Поиск...") {
            map.getView().animate({
                center: fromLonLat([cityCoords.lon, cityCoords.lat]),
                zoom: 11,
                duration: 500
            });
        }
    }, [cityCoords, routeStatus, currentRouteData]);

    // Handle Route (Polyline)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear previous route layer
        if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }

        if (currentRouteData?.points?.length) {
            // points are [lat, lon]
            const coordinates = currentRouteData.points.map(([lat, lon]) => fromLonLat([lon, lat]));

            const routeFeature = new Feature({
                geometry: new LineString(coordinates),
            });

            const routeStyle = new Style({
                stroke: new Stroke({
                    color: '#444444',
                    width: 3,
                }),
            });
            routeFeature.setStyle(routeStyle);

            const vectorSource = new VectorSource({
                features: [routeFeature],
            });

            const vectorLayer = new VectorLayer({
                source: vectorSource,
            });

            map.addLayer(vectorLayer);
            routeLayerRef.current = vectorLayer;

            // Fit bounds
            const extent = vectorSource.getExtent();
            const isMobile = window.innerWidth < 768;
            const padding = isMobile ? [25, 30, 25, 25] : [30, 30, 30, 30];

            map.getView().fit(extent, {
                padding: padding,
                duration: 500 // animate
            });
        }
    }, [currentRouteData]);

    // Handle Markers (using Overlays for HTML content)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing overlays
        overlaysRef.current.forEach(overlay => map.removeOverlay(overlay));
        overlaysRef.current = [];

        // Helper to create overlay
        const createOverlay = (coords: [number, number], element: HTMLElement, positioning: 'center-center' | 'bottom-center' = 'center-center') => {
            const overlay = new Overlay({
                element: element,
                position: fromLonLat(coords), // [lon, lat]
                positioning: positioning,
                stopEvent: false,
            });
            map.addOverlay(overlay);
            overlaysRef.current.push(overlay);
        };

        // Route Start (A)
        if (currentRouteData?.points?.[0]) {
            const [lat, lon] = currentRouteData.points[0];
            const el = document.createElement('div');
            el.style.cssText = "display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #444444; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);";
            el.innerText = 'A';
            createOverlay([lon, lat], el);
        }

        // Route End (B)
        if (currentRouteData?.points?.length) {
            const [lat, lon] = currentRouteData.points[currentRouteData.points.length - 1];
            const el = document.createElement('div');
            el.style.cssText = "display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #444444; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);";
            el.innerText = 'B';
            createOverlay([lon, lat], el);
        }

        // Custom Markers
        markers?.forEach(m => {
            const el = document.createElement('div');
            el.style.cssText = "background-color: white; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap; font-size: 11px; font-weight: bold; color: black; font-family: sans-serif; margin-bottom: 4px;";
            el.innerText = m.label;
            // m.coords is [lat, lon], so reverse for fromLonLat
            createOverlay([m.coords[1], m.coords[0]], el, 'bottom-center');
        });

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

            <div className="absolute right-4 top-4 bottom-4 z-20 flex flex-col items-center justify-between py-2">
                {/* Zoom Controls */}
                <div className="flex flex-col gap-2">
                    <button
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:bg-gray-100 transition-colors"
                        onClick={() => {
                            const view = mapInstanceRef.current?.getView();
                            if (view) {
                                view.animate({ zoom: (view.getZoom() || 0) + 1, duration: 250 });
                            }
                        }}
                    >
                        <PlusIcon width={20} height={20} />
                    </button>
                    <button
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:bg-gray-100 transition-colors"
                        onClick={() => {
                            const view = mapInstanceRef.current?.getView();
                            if (view) {
                                view.animate({ zoom: (view.getZoom() || 0) - 1, duration: 250 });
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
                                
                                // Reset rotation
                                map.getView().animate({ rotation: 0, duration: 350 });
                                
                                // Re-fit bounds if we have route data
                                if (currentRouteData?.points?.length && routeLayerRef.current) {
                                    const vectorSource = routeLayerRef.current.getSource();
                                    if (vectorSource) {
                                        const extent = vectorSource.getExtent();
                                        const isMobile = window.innerWidth < 768;
                                        const padding = isMobile ? [25, 30, 25, 25] : [30, 30, 30, 30];
                                        map.getView().fit(extent, {
                                            padding: padding,
                                            duration: 500
                                        });
                                    }
                                } else {
                                    // Default center if no route
                                    map.getView().animate({
                                        center: fromLonLat([cityCoords.lon, cityCoords.lat]),
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
                                style={{ transform: `rotate(${windDeg + 180 + (rotation * 180 / Math.PI)}deg)` }}
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

declare global {
    // interface Window {
    //     mapgl: any;
    // }
}

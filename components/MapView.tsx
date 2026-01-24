import React, { useEffect, useRef, useState } from "react";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";

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

const API_KEY = "6591128b-36b9-4693-bf58-b3617cb6f043";

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus, markers, windDeg, windSpeed, windDirection }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);

    // Load 2GIS Script
    useEffect(() => {
        if (window.mapgl) {
            setIsMapReady(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://mapgl.2gis.com/api/js/v1";
        script.async = true;
        script.onload = () => setIsMapReady(true);
        document.body.appendChild(script);

        return () => {
            // Cleanup script if needed? Usually keeps it.
        };
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!isMapReady || !mapContainerRef.current || mapInstanceRef.current) return;

        const map = new window.mapgl.Map(mapContainerRef.current, {
            center: [cityCoords.lon, cityCoords.lat],
            zoom: 11,
            key: API_KEY,
            lang: "ru",
            style: "c080bb6a-8134-4993-93a1-5b4d8c36a59b" // Standard style, or omit for default
        });

        mapInstanceRef.current = map;

        // Add controls if needed, but UI seems minimal
        // map.on('click', (e) => console.log(e));

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, [isMapReady]); // Init only once when ready

    // Update Center/Zoom if no route
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || currentRouteData) return;

        if (routeStatus !== "Поиск...") {
             map.setCenter([cityCoords.lon, cityCoords.lat], { animate: true });
             map.setZoom(11, { animate: true });
        }
    }, [cityCoords, routeStatus, currentRouteData, isMapReady]);

    // Handle Route (Polyline)
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Remove existing polyline
        if (polylineRef.current) {
            polylineRef.current.destroy();
            polylineRef.current = null;
        }

        if (currentRouteData?.points?.length) {
            // 2GIS uses [lon, lat]
            const coordinates = currentRouteData.points.map(([lat, lon]) => [lon, lat]);

            polylineRef.current = new window.mapgl.Polyline(map, {
                coordinates: coordinates,
                width: 3,
                color: '#444444', // Dark grey
            });

            // Fit bounds
            // Calculate bounds
            let minLon = coordinates[0][0], maxLon = coordinates[0][0];
            let minLat = coordinates[0][1], maxLat = coordinates[0][1];

            coordinates.forEach(coord => {
                if (coord[0] < minLon) minLon = coord[0];
                if (coord[0] > maxLon) maxLon = coord[0];
                if (coord[1] < minLat) minLat = coord[1];
                if (coord[1] > maxLat) maxLat = coord[1];
            });

            // 2GIS fitBounds: southWest, northEast
            // SW: [minLon, minLat], NE: [maxLon, maxLat]
            map.fitBounds({
                southWest: [minLon, minLat],
                northEast: [maxLon, maxLat]
            }, {
                padding: { top: 60, bottom: 60, left: 60, right: 60 },
                animate: false 
            });
        }
    }, [currentRouteData, isMapReady]);

    // Handle Markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.destroy());
        markersRef.current = [];

        // Route Start (A)
        if (currentRouteData?.points?.[0]) {
            const [lat, lon] = currentRouteData.points[0];
            const marker = new window.mapgl.HtmlMarker(map, {
                coordinates: [lon, lat],
                html: `<div style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #444444; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">A</div>`,
                anchor: [0.5, 0.5] // Center
            });
            markersRef.current.push(marker);
        }

        // Route End (B)
        if (currentRouteData?.points?.length) {
            const [lat, lon] = currentRouteData.points[currentRouteData.points.length - 1];
            const marker = new window.mapgl.HtmlMarker(map, {
                coordinates: [lon, lat],
                html: `<div style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #444444; border-radius: 50%; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">B</div>`,
                anchor: [0.5, 0.5] // Center
            });
            markersRef.current.push(marker);
        }

        // Custom Markers
        markers?.forEach(m => {
            const marker = new window.mapgl.HtmlMarker(map, {
                coordinates: [m.coords[1], m.coords[0]],
                html: `<div style="background-color: white; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap; font-size: 11px; font-weight: bold; color: black; font-family: sans-serif; margin-bottom: 4px;">${m.label}</div>`,
                anchor: [0.5, 1] // Bottom
            });
            markersRef.current.push(marker);
        });

    }, [currentRouteData, markers, isMapReady]);

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
            {windDeg !== undefined && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
                    <div 
                        className="w-6 h-6 rounded-full bg-[#E1E1E2]/80 flex items-center justify-center"
                        title={`Ветер ${windDeg}°`}
                    >
                        <svg 
                            width="14" 
                            height="14" 
                            viewBox="0 0 24 24" 
                            fill="#777777" 
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ transform: `rotate(${windDeg + 180}deg)` }}
                        >
                            <path d="M12 2L4.5 20.29C4.24 20.92 4.89 21.57 5.53 21.34L12 19L18.47 21.34C19.11 21.57 19.76 20.92 19.5 20.29L12 2Z" />
                        </svg>
                    </div>
                    {(windSpeed || windDirection) && (
                        <div className="flex flex-col items-start">
                             {windSpeed && (
                                <span className="text-xs text-[#777777] font-sans leading-none mb-0.5">
                                    {getAverageWindSpeed(windSpeed)}
                                </span>
                             )}
                             {windDirection && (
                                <span className="text-[10px] text-[#777777] uppercase font-sans leading-none">
                                    {windDirection}
                                </span>
                             )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

declare global {
    interface Window {
        mapgl: any;
    }
}

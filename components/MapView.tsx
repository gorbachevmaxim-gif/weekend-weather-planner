import React, { useEffect, useRef, useState, useCallback } from "react";
import PlusIcon from "./icons/PlusIcon";
import MinusIcon from "./icons/MinusIcon";
import CenterIcon from "./icons/CenterIcon";
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
    isDark?: boolean;
    onFullscreenToggle?: (isFullscreen: boolean) => void;
    routeCount?: number;
    selectedRouteIdx?: number;
    onRouteSelect?: (idx: number) => void;
    pace?: number;
    startTemp?: number;
    endTemp?: number;
    elevationCursor?: [number, number] | null;
}

interface HoverInfo {
    pace: string;
    distStart: string;
    distEnd: string;
    timeStart: string;
    timeEnd: string;
    temp: string;
    wind?: { value: string; label: string };
}

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

const getPlacementClasses = (deg?: number) => {
    if (deg === undefined) return "bottom-full left-1/2 -translate-x-1/2 mb-5"; 

    const normalized = (deg % 360 + 360) % 360;
    
    if (normalized >= 315 || normalized < 45) {
         // Wind from N -> Place N (Top)
         return "bottom-full left-1/2 -translate-x-1/2 mb-5";
    } else if (normalized >= 45 && normalized < 135) {
         // Wind from E -> Place E (Right)
         return "left-full top-1/2 -translate-y-1/2 ml-5";
    } else if (normalized >= 135 && normalized < 225) {
         // Wind from S -> Place S (Bottom)
         return "top-full left-1/2 -translate-x-1/2 mt-5";
    } else {
         // Wind from W -> Place W (Left)
         return "right-full top-1/2 -translate-y-1/2 mr-5";
    }
};

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus, markers, windDeg, windSpeed, windDirection, isDark = false, onFullscreenToggle, routeCount = 0, selectedRouteIdx = 0, onRouteSelect, pace = 25, startTemp, endTemp, elevationCursor }) => {
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [windPos, setWindPos] = useState<{ x: number; y: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const windDragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            if (onFullscreenToggle) {
                onFullscreenToggle(isFs);
            }
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, [onFullscreenToggle]);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const styleUrl = isDark 
            ? 'https://tiles.versatiles.org/assets/styles/eclipse/style.json'
            : 'https://tiles.versatiles.org/assets/styles/graybeard/style.json';

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: styleUrl,
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
    }, [isDark]); // Re-initialize on theme change

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
                                'line-color': isDark ? '#CCCCCC' : '#444444',
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
                                'circle-color': isDark ? '#CCCCCC' : '#444444',
                                'circle-stroke-width': 1,
                                'circle-stroke-color': isDark ? '#333333' : '#ffffff'
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
                                'text-color': isDark ? '#333333' : '#ffffff'
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
    }, [currentRouteData, isDark]);

    const markersRef = useRef<{ custom: maplibregl.Marker[] }>({ custom: [] });
    const cursorRef = useRef<maplibregl.Marker | null>(null);

    // Handle Elevation Cursor
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const size = isMobile ? '14px' : '12px';

        if (elevationCursor) {
            let markerElement = cursorRef.current ? cursorRef.current.getElement() : null;

            if (!markerElement) {
                markerElement = document.createElement('div');
                markerElement.className = 'elevation-cursor-marker';
                markerElement.style.display = 'flex';
                markerElement.style.alignItems = 'center';
                markerElement.style.justifyContent = 'center';
                
                cursorRef.current = new maplibregl.Marker({ element: markerElement })
                    .setLngLat([elevationCursor[1], elevationCursor[0]])
                    .addTo(map);
            } else if (cursorRef.current) {
                cursorRef.current.setLngLat([elevationCursor[1], elevationCursor[0]]);
            }

            // Ensure container size
            markerElement.style.width = size;
            markerElement.style.height = size;
            
            // 1. Wind Arrow Wrapper
            let arrowWrapper = markerElement.querySelector('.wind-arrow-wrapper') as HTMLElement;
            if (windDeg !== undefined) {
                if (!arrowWrapper) {
                    arrowWrapper = document.createElement('div');
                    arrowWrapper.className = 'wind-arrow-wrapper';
                    arrowWrapper.style.position = 'absolute';
                    arrowWrapper.style.top = '0';
                    arrowWrapper.style.left = '0';
                    arrowWrapper.style.width = '100%';
                    arrowWrapper.style.height = '100%';
                    arrowWrapper.style.pointerEvents = 'none';
                    
                    const arrow = document.createElement('div');
                    arrow.style.position = 'absolute';
                    arrow.style.top = '-33px';
                    arrow.style.left = '50%';
                    arrow.style.transform = 'translateX(-50%) rotate(180deg)';
                    
                    const fill = isDark ? "#FFFFFF" : "#1E1E1E";
                    const stroke = isDark ? "#1E1E1E" : "#FFFFFF";
                    
                    arrow.innerHTML = `<svg width="27" height="27" viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M10.9 4.5L4.0 20.29C3.74 20.92 4.39 21.57 5.03 21.34L12 19L18.97 21.34C19.61 21.57 20.26 20.92 20.0 20.29L13.1 4.5Q12 1 10.9 4.5Z" stroke="${stroke}" stroke-width="1.5" /></svg>`;
                    
                    arrowWrapper.appendChild(arrow);
                    markerElement.appendChild(arrowWrapper);
                }
                // Update transform
                arrowWrapper.style.transform = `rotate(${windDeg - rotation}deg)`;
                
                const svg = arrowWrapper.querySelector('svg');
                if (svg) {
                     const fill = isDark ? "#FFFFFF" : "#1E1E1E";
                     const stroke = isDark ? "#1E1E1E" : "#FFFFFF";
                     svg.setAttribute('fill', fill);
                     const path = svg.querySelector('path');
                     if (path) path.setAttribute('stroke', stroke);
                }

            } else {
                if (arrowWrapper) {
                    arrowWrapper.remove();
                }
            }

            // 2. Dot
            let dot = markerElement.querySelector('.cursor-dot') as HTMLElement;
            if (!dot) {
                dot = document.createElement('div');
                dot.className = 'cursor-dot';
                dot.style.width = '100%';
                dot.style.height = '100%';
                dot.style.borderRadius = '50%';
                dot.style.border = '2px solid white';
                dot.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
                markerElement.appendChild(dot);
            }
            dot.style.backgroundColor = isDark ? '#ffffff' : '#000000';

        } else {
            if (cursorRef.current) {
                cursorRef.current.remove();
                cursorRef.current = null;
            }
        }
    }, [elevationCursor, isDark, isMobile, windDeg, rotation]);

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


    const handleWindMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!windDragRef.current) return;
        
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

        const deltaX = clientX - windDragRef.current.startX;
        const deltaY = clientY - windDragRef.current.startY;

        setWindPos({
            x: windDragRef.current.startLeft + deltaX,
            y: windDragRef.current.startTop + deltaY
        });
    }, []);

    const handleWindMouseUp = useCallback(() => {
        windDragRef.current = null;
        document.removeEventListener('mousemove', handleWindMouseMove);
        document.removeEventListener('mouseup', handleWindMouseUp);
        document.removeEventListener('touchmove', handleWindMouseMove);
        document.removeEventListener('touchend', handleWindMouseUp);
    }, [handleWindMouseMove]);

    const handleWindMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isFullscreen) return;

        e.preventDefault();
        const isTouch = 'touches' in e;
        const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

        const el = e.currentTarget as HTMLElement;
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const wrapperRect = wrapper.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        windDragRef.current = {
            startX: clientX,
            startY: clientY,
            startLeft: elRect.left - wrapperRect.left,
            startTop: elRect.top - wrapperRect.top
        };

        document.addEventListener('mousemove', handleWindMouseMove);
        document.addEventListener('mouseup', handleWindMouseUp);
        document.addEventListener('touchmove', handleWindMouseMove, { passive: false });
        document.addEventListener('touchend', handleWindMouseUp);
    };

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleWindMouseMove);
            document.removeEventListener('mouseup', handleWindMouseUp);
            document.removeEventListener('touchmove', handleWindMouseMove);
            document.removeEventListener('touchend', handleWindMouseUp);
        };
    }, [handleWindMouseMove, handleWindMouseUp]);

    const handleCenterMap = useCallback(() => {
        setWindPos(null);
        setHoverInfo(null);
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
    }, [currentRouteData, cityCoords]);

    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true;
            return;
        }

        const map = mapInstanceRef.current;
        if (map) {
            setTimeout(() => {
                map.resize();
                handleCenterMap();
            }, 200);
        }
    }, [isFullscreen, handleCenterMap]);

    // Calculate hover info when windPos changes
    useEffect(() => {
        if (!windPos || !currentRouteData || !mapInstanceRef.current) {
            setHoverInfo(null);
            return;
        }

        const map = mapInstanceRef.current;
        const centerX = windPos.x + 46;
        const centerY = windPos.y + 46;
        const threshold = 30; // pixels

        // Find nearest point on route
        let minDistSq = Infinity;
        let closestInfo: { distFromStart: number; index: number; t: number } | null = null;

        const points = currentRouteData.points;
        const cumDists = currentRouteData.cumulativeDistances;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = map.project([points[i][1], points[i][0]]);
            const p2 = map.project([points[i+1][1], points[i+1][0]]);

            // Vector P1 -> P2
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lenSq = dx * dx + dy * dy;

            let t = 0;
            if (lenSq !== 0) {
                // Project wind pos onto segment
                t = ((centerX - p1.x) * dx + (centerY - p1.y) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t));
            }

            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            
            const distSq = (centerX - closestX) ** 2 + (centerY - closestY) ** 2;

            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestInfo = {
                    distFromStart: cumDists[i] + t * (cumDists[i+1] - cumDists[i]),
                    index: i,
                    t
                };
            }
        }

        if (closestInfo && minDistSq < threshold * threshold) {
            const distStart = closestInfo.distFromStart;
            const totalDist = currentRouteData.distanceKm;
            const distEnd = totalDist - distStart;

            const timeStartHours = distStart / pace;
            const timeStartH = Math.floor(timeStartHours);
            const timeStartM = Math.round((timeStartHours - timeStartH) * 60);
            
            const timeEndHours = distEnd / pace;
            const timeEndH = Math.floor(timeEndHours);
            const timeEndM = Math.round((timeEndHours - timeEndH) * 60);

            let tempStr = "N/A";
            if (startTemp !== undefined && endTemp !== undefined) {
                const currentTemp = startTemp + (endTemp - startTemp) * (distStart / totalDist);
                tempStr = `${Math.round(currentTemp)}º`;
            }

            const info: HoverInfo = {
                pace: `${pace} км/ч`,
                distStart: `${distStart.toFixed(0)} км`,
                distEnd: `${distEnd.toFixed(0)} км`,
                timeStart: `${String(timeStartH).padStart(2, '0')}:${String(timeStartM).padStart(2, '0')}`,
                timeEnd: `${String(timeEndH).padStart(2, '0')}:${String(timeEndM).padStart(2, '0')}`,
                temp: `${tempStr}`
            };

            if (windSpeed || windDirection) {
                info.wind = {
                    value: getAverageWindSpeed(windSpeed),
                    label: `Ветер ${windDirection || ''}`.trim()
                };
            }

            setHoverInfo(info);
        } else {
            setHoverInfo(null);
        }

    }, [windPos, currentRouteData, pace, startTemp, endTemp, windSpeed, windDirection]);

    return (
        <div ref={wrapperRef} className="relative w-full aspect-square md:aspect-[3/2] bg-slate-100 z-0 rounded-lg overflow-hidden">
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%", filter: isDark ? "none" : "grayscale(100%)" }} /> 
            
            {!currentRouteData && routeStatus && routeStatus !== "Поиск..." && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                        <p className="text-xs font-bold text-center text-[#1E1E1E]">
                            {routeStatus}
                        </p>
                    </div>
                </div>
            )}


            {/* Top-left controls */}
            <div className="absolute left-4 top-4 z-20 flex flex-col items-center gap-2">
                {!isMobile && !isFullscreen && (
                    <button
                        className={`w-8 h-8 backdrop-blur rounded-md shadow-md flex items-center justify-center transition-colors ${
                            isDark 
                            ? "bg-[#333333]/90 text-white hover:bg-[#444444] active:bg-[#222222]" 
                            : "bg-white/90 text-[#1E1E1E] hover:bg-white active:bg-gray-100"
                        }`}
                        onClick={() => {
                            wrapperRef.current?.requestFullscreen().catch(err => {
                                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                            });
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                        </svg>
                    </button>
                )}
                <button
                    className={`w-8 h-8 backdrop-blur rounded-md shadow-md flex items-center justify-center transition-colors ${
                        isDark 
                        ? "bg-[#333333]/90 text-white hover:bg-[#444444] active:bg-[#222222]" 
                        : "bg-white/90 text-[#1E1E1E] hover:bg-white active:bg-gray-100"
                    }`}
                    onClick={handleCenterMap}
                >
                    <CenterIcon width={20} height={20} />
                </button>

                {routeCount > 1 && onRouteSelect && (
                    <>
                        {Array.from({ length: routeCount }).map((_, idx) => (
                            <button
                                key={idx}
                                className={`w-8 h-8 backdrop-blur rounded-md shadow-md flex items-center justify-center transition-colors font-unbounded text-xs font-medium ${
                                    selectedRouteIdx === idx
                                        ? (isDark ? "bg-white text-[#1E1E1E]" : "bg-[#1E1E1E] text-white")
                                        : (isDark 
                                            ? "bg-[#333333]/90 text-white hover:bg-[#444444] active:bg-[#222222]" 
                                            : "bg-white/90 text-[#1E1E1E] hover:bg-white active:bg-gray-100")
                                }`}
                                onClick={() => onRouteSelect(idx)}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </>
                )}
            </div>

            {/* Bottom-left controls */}
            <div 
                className={`absolute z-20 flex flex-col items-center p-[30px] ${windPos ? '' : '-left-[14px] bottom-[10px]'} ${isFullscreen ? 'cursor-move' : ''} ${isMobile ? 'hidden' : ''}`}
                style={windPos ? { left: windPos.x, top: windPos.y } : undefined}
                onMouseDown={handleWindMouseDown}
                onTouchStart={handleWindMouseDown}
                title={isFullscreen ? "Перемещай вдоль трека, вращай карту" : undefined}
            >
                {windDeg !== undefined && (
                    <div className="relative flex flex-col items-center w-8">
                        <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                                isDark 
                                ? "bg-[#333333]/70" 
                                : "bg-white/70"
                            }`}
                        >
                            <svg 
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill={isDark ? "#FFFFFF" : "#1E1E1E"} 
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: `rotate(${windDeg + 180 - rotation}deg)` }}
                            >
                                <path d="M10.9 4.5L4.0 20.29C3.74 20.92 4.39 21.57 5.03 21.34L12 19L18.97 21.34C19.61 21.57 20.26 20.92 20.0 20.29L13.1 4.5Q12 1 10.9 4.5Z" />
                            </svg>
                        </div>
                        {(windSpeed || windDirection) && !windPos && (
                            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex flex-col items-center w-max pointer-events-none">
                                {windSpeed && (
                                    <span className={`text-[13px] font-sans leading-none mb-0.5 ${isDark ? "text-[#EEEEEE]" : "text-[#444444]"}`}>
                                        {getAverageWindSpeed(windSpeed)}
                                    </span>
                                )}
                                {windDirection && (
                                    <span className={`text-[11px] uppercase font-sans leading-none ${isDark ? "text-[#EEEEEE]" : "text-[#444444]"}`}>
                                        {windDirection}
                                    </span>
                                )}
                            </div>
                        )}
                        {/* Hover Info Pill */}
                        {hoverInfo && (
                            <div 
                                className={`absolute ${getPlacementClasses(windDeg)} backdrop-blur rounded-md p-2 shadow-md grid grid-cols-[max-content_max-content_max-content] gap-x-3 gap-y-0.5 pointer-events-none ${
                                    isDark ? "bg-[#333333]/80 text-[#EEEEEE]" : "bg-white/80 text-[#1E1E1E]"
                                }`}
                            >
                                {/* Pace */}
                                <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.pace}</span>
                                <span className="text-[11px] font-sans leading-tight text-left opacity-75">Средняя</span>
                                <span />

                                {/* Start */}
                                <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.distStart}</span>
                                <span className="text-[11px] font-sans leading-tight text-left opacity-75">От старта</span>
                                <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.timeStart}</span>

                                {/* End */}
                                <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.distEnd}</span>
                                <span className="text-[11px] font-sans leading-tight text-left opacity-75">До финиша</span>
                                <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.timeEnd}</span>

                                {/* Temperature */}
                                <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.temp}</span>
                                <span className="text-[11px] font-sans leading-tight text-left opacity-75">Температура</span>
                                <span />

                                {/* Wind */}
                                {hoverInfo.wind && (
                                    <>
                                        <span className="text-[11px] font-sans leading-tight font-medium text-left">{hoverInfo.wind.value}</span>
                                        <span className="text-[11px] font-sans leading-tight text-left opacity-75">{hoverInfo.wind.label}</span>
                                        <span />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

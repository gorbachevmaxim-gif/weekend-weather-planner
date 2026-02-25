import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";
import { calculateElevationProfile, ElevationPoint } from "../utils/elevationUtils";
import ElevationProfile from "./ElevationProfile";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MapControls from "./map/MapControls";
import MapMarkers from "./map/MapMarkers";
import RouteLayer from "./map/RouteLayer";
import WindIndicator from "./map/WindIndicator";

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
    onTargetSpeedChange?: (speed: number) => void;
    startTemp?: number;
    endTemp?: number;
    elevationCursor?: [number, number] | null;
    onElevationHover?: (point: ElevationPoint | null) => void;
    hourlyWind?: number[];
    hourlyWindDir?: number[];
    isMountainRegion?: boolean;
    startCityName?: string;
    endCityName?: string;
}

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus, markers, windDeg, windSpeed, windDirection, isDark = false, onFullscreenToggle, routeCount = 0, selectedRouteIdx = 0, onRouteSelect, pace: initialPace = 25, onTargetSpeedChange, startTemp, endTemp, elevationCursor, onElevationHover, hourlyWind, hourlyWindDir, isMountainRegion = false, startCityName, endCityName }) => {
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [windPos, setWindPos] = useState<{ x: number; y: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [hoverInfo, setHoverInfo] = useState<ElevationPoint | null>(null);
    const [internalCursor, setInternalCursor] = useState<[number, number] | null>(null);
    const [pace, setPace] = useState(initialPace);

    const activeCursor = elevationCursor || internalCursor;

    // Sync internal pace state
    useEffect(() => {
        setPace(initialPace);
    }, [initialPace]);

    // Handle speed change from ElevationProfile
    const handleTargetSpeedChange = useCallback((newSpeed: number) => {
        setPace(newSpeed);
        if (onTargetSpeedChange) {
            onTargetSpeedChange(newSpeed);
        }
    }, [onTargetSpeedChange]);

    const elevationData = useMemo(() => {
        if (!currentRouteData) return [];
        return calculateElevationProfile(
            currentRouteData.points, 
            currentRouteData.cumulativeDistances, 
            pace,
            isMountainRegion
        );
    }, [currentRouteData, pace, isMountainRegion]);

    // Update hoverInfo when elevationData changes
    useEffect(() => {
        if (hoverInfo && elevationData.length > 0) {
            const matchingPoint = elevationData.find(
                p => Math.abs(p.lat - hoverInfo.lat) < 0.0001 && Math.abs(p.lon - hoverInfo.lon) < 0.0001
            );
            if (matchingPoint) {
                setHoverInfo(matchingPoint);
            }
        }
    }, [elevationData]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const windDragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const cursorRef = useRef<maplibregl.Marker | null>(null);
    const isMountedRef = useRef(false);
    const handleCenterMapRef = useRef<(() => void) | null>(null);

    const toggleFullscreen = useCallback(() => {
        const elem = wrapperRef.current;
        if (!elem) return;

        const isNativeFullscreen = !!document.fullscreenElement;

        if (isFullscreen) {
            if (isNativeFullscreen) {
                document.exitFullscreen().catch(console.error);
            } else {
                setIsFullscreen(false);
                setInternalCursor(null);
                setHoverInfo(null);
                if (onFullscreenToggle) onFullscreenToggle(false);
            }
        } else {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {
                    setIsFullscreen(true);
                    if (onFullscreenToggle) onFullscreenToggle(true);
                });
            } else {
                setIsFullscreen(true);
                if (onFullscreenToggle) onFullscreenToggle(true);
            }
        }
    }, [isFullscreen, onFullscreenToggle]);

    useEffect(() => {
        const handleNativeChange = () => {
             const isFs = !!document.fullscreenElement;
             if (isFs) {
                 setIsFullscreen(true);
                 if (onFullscreenToggle) onFullscreenToggle(true);
             } else {
                 setIsFullscreen(false);
                 setInternalCursor(null);
                 setHoverInfo(null);
                 if (onFullscreenToggle) onFullscreenToggle(false);
             }
        };
        
        document.addEventListener("fullscreenchange", handleNativeChange);
        return () => document.removeEventListener("fullscreenchange", handleNativeChange);
    }, [onFullscreenToggle]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            setWindowWidth(window.innerWidth);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const styleUrl = isDark 
            ? '/styles/style-dark.json'
            : '/styles/style-light.json';

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: styleUrl,
            center: [cityCoords.lon, cityCoords.lat],
            zoom: 11,
            attributionControl: false,
            cooperativeGestures: true
        });

        map.on('rotate', () => {
            setRotation(map.getBearing());
        });

        mapInstanceRef.current = map;

        let debounceTimer: ReturnType<typeof setTimeout>;
        const resizeObserver = new ResizeObserver(() => {
            map.resize();
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                 handleCenterMapRef.current?.();
            }, 100);
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            resizeObserver.disconnect();
            map.remove();
        };
    }, [cityCoords.lat, cityCoords.lon]);

    // Handle theme changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const styleUrl = isDark 
            ? '/styles/style-dark.json'
            : '/styles/style-light.json';

        try {
            map.setStyle(styleUrl);
        } catch (e) {
            console.warn("Failed to set map style:", e);
        }
    }, [isDark]);

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

    // Handle Elevation Cursor
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const size = isMobile ? '14px' : '12px';

        if (activeCursor) {
            let markerElement = cursorRef.current ? cursorRef.current.getElement() : null;

            if (!markerElement) {
                markerElement = document.createElement('div');
                markerElement.className = 'elevation-cursor-marker';
                markerElement.style.display = 'flex';
                markerElement.style.alignItems = 'center';
                markerElement.style.justifyContent = 'center';
                
                cursorRef.current = new maplibregl.Marker({ element: markerElement })
                    .setLngLat([activeCursor[1], activeCursor[0]])
                    .addTo(map);
            } else if (cursorRef.current) {
                cursorRef.current.setLngLat([activeCursor[1], activeCursor[0]]);
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
                    markerElement.appendChild(arrowWrapper);
                }

            const color = isDark ? "#FFFFFF" : "#111111";
            const outlineColor = isDark ? "rgb(19, 13, 8)" : "rgb(243, 242, 242)";
            const outlinePath = `<path d="M12 19V5M5 12l7-7 7 7" stroke="${outlineColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`;
            const arrowHtml = `<div style="position: absolute; top: -33px; left: 50%; transform: translateX(-50%) rotate(180deg);"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${outlinePath}<path d="M12 19V5M5 12l7-7 7 7" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></div>`;
                
                if (arrowWrapper.innerHTML !== arrowHtml) {
                     arrowWrapper.innerHTML = arrowHtml;
                }

                // Calculate wind direction based on hover time if available
                let currentWindDeg = windDeg;
                if (hoverInfo && hourlyWindDir && hourlyWindDir.length > 0) {
                    const hourIndex = Math.min(Math.round(hoverInfo.time + 1), hourlyWindDir.length - 1);
                    const timeBasedWindDir = hourlyWindDir[hourIndex];
                    if (timeBasedWindDir !== undefined) {
                        currentWindDeg = timeBasedWindDir;
                    }
                }

                // Update transform
                arrowWrapper.style.transform = `rotate(${currentWindDeg - rotation}deg)`;

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
                markerElement.appendChild(dot);
            }
            dot.style.border = `2px solid ${isDark ? 'rgb(19, 13, 8)' : 'rgb(243, 242, 242)'}`;
            dot.style.boxShadow = isDark ? '0 0 4px rgba(0,0,0,0.5)' : 'none';
            dot.style.backgroundColor = isDark ? '#ffffff' : '#000000';

        } else {
            if (cursorRef.current) {
                cursorRef.current.remove();
                cursorRef.current = null;
            }
        }
    }, [activeCursor, isDark, isMobile, windDeg, rotation, hoverInfo, hourlyWindDir]);

    const handleWindMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!windDragRef.current) return;

        if (e.cancelable) {
            e.preventDefault();
        }
        
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
        setInternalCursor(null);
        const map = mapInstanceRef.current;
        if (!map) return;
        
        map.easeTo({ bearing: 0, duration: 350 });
        
        if (currentRouteData?.points?.length) {
            const coordinates = currentRouteData.points.map(([lat, lon]) => [lon, lat]);
            const bounds = new maplibregl.LngLatBounds();
            coordinates.forEach(coord => bounds.extend(coord as [number, number]));
            
            let padding: any = isMobile 
                ? { top: 50, bottom: 50, left: 55, right: 50 }
                : 80;
            
            if (isFullscreen) {
                padding = {
                    top: 100,
                    bottom: isMobile ? 200 : 250,
                    left: 50,
                    right: 50
                };
            }

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
    }, [currentRouteData, cityCoords, isMobile, isFullscreen]);

    useEffect(() => {
        handleCenterMapRef.current = handleCenterMap;
    }, [handleCenterMap]);

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
        if (!windPos || !currentRouteData || !mapInstanceRef.current || elevationData.length === 0) {
            return;
        }

        const map = mapInstanceRef.current;
        const centerX = windPos.x + 46;
        const centerY = windPos.y + 46;
        const threshold = 30; // pixels

        // Find nearest point on route
        let minDistSq = Infinity;
        let closestIdx = -1;

        const points = currentRouteData.points;

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
                // Snap to nearest point
                closestIdx = t < 0.5 ? i : i + 1;
            }
        }

        if (closestIdx !== -1 && minDistSq < threshold * threshold) {
            setHoverInfo(elevationData[closestIdx]);
        } else {
            setHoverInfo(null);
        }

    }, [windPos, currentRouteData, pace, elevationData]);

    const handleProfileHover = useCallback((point: ElevationPoint | null) => {
        if (point) {
            setInternalCursor([point.lat, point.lon]);
            setHoverInfo(point);
            setWindPos(null);
            // Sync with external state (for CityDetail's elevationHoverPoint)
            if (onElevationHover) {
                onElevationHover(point);
            }
        } else {
            setInternalCursor(null);
            setHoverInfo(null);
            setWindPos(null);
            if (onElevationHover) {
                onElevationHover(null);
            }
        }
    }, [onElevationHover]);

    return (
        <div 
            ref={wrapperRef} 
            className={`${isFullscreen ? "fixed inset-0 z-[9999] h-[100dvh] rounded-none" : "relative w-full aspect-[13/12] z-0 rounded-lg"} bg-slate-100 overflow-hidden transition-all duration-300`}
        >
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "100%", filter: isDark ? "none" : "grayscale(100%)" }} /> 
            
            <div className={`absolute top-0 right-0 z-10 px-1 text-[10px] pointer-events-auto font-sans ${isDark ? "text-[#333333]" : "text-black/50"}`}>
                <a href="https://versatiles.org" target="_blank" rel="noreferrer" className="hover:underline">VersaTiles</a>
                <span> | </span>
                <a href="https://maplibre.org" target="_blank" rel="noreferrer" className="hover:underline">MapLibre</a>
                <span> | </span>
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:underline">OpenStreetMap</a>
            </div>

            {isFullscreen && currentRouteData && (
                <div className={`absolute left-1/2 -translate-x-1/2 z-20 ${isMobile ? "bottom-[52px]" : "bottom-8"}`}>
                    <ElevationProfile 
                        routeData={currentRouteData}
                        isDark={isDark}
                        width={isMobile ? windowWidth * 0.70 : windowWidth * 0.45}
                        height={isMobile ? 70 : 80}
                        showAxes={false}
                        variant="overlay"
                        showTooltip={true}
                        showTooltipOnLoad={true}
                        externalHoverPoint={hoverInfo}
                        onHover={handleProfileHover}
                        targetSpeed={pace}
                        onTargetSpeedChange={handleTargetSpeedChange}
                        isMountainRegion={isMountainRegion}
                        startTemp={startTemp}
                        endTemp={endTemp}
                        hourlyWind={hourlyWind}
                        hourlyWindDir={hourlyWindDir}
                        tooltipOffset={2}
                        routeDistanceKm={currentRouteData?.distanceKm}
                        totalElevationGain={currentRouteData?.elevationM}
                        startCityName={startCityName}
                        endCityName={endCityName}
                    />
                </div>
            )}

            {!currentRouteData && routeStatus && routeStatus !== "Поиск..." && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                        <p className="text-xs font-bold text-center text-[#111111]">
                            {routeStatus}
                        </p>
                    </div>
                </div>
            )}

            <MapControls
                isFullscreen={isFullscreen}
                isDark={isDark}
                isMobile={isMobile}
                onToggleFullscreen={toggleFullscreen}
                onCenterMap={handleCenterMap}
                routeCount={routeCount}
                selectedRouteIdx={selectedRouteIdx}
                onRouteSelect={onRouteSelect}
            />

            {!isFullscreen && (
                <WindIndicator
                    windDeg={windDeg}
                    windSpeed={windSpeed}
                    windDirection={windDirection}
                    rotation={rotation}
                    isDark={isDark}
                    windPos={windPos}
                    hoverInfo={hoverInfo}
                    startTemp={startTemp}
                    endTemp={endTemp}
                    elevationData={elevationData}
                    currentRouteDataDistance={currentRouteData?.distanceKm}
                    hourlyWind={hourlyWind}
                    hourlyWindDir={hourlyWindDir}
                    onMouseDown={handleWindMouseDown}
                />
            )}

            <MapMarkers map={mapInstanceRef.current} markers={markers} />
            <RouteLayer 
                map={mapInstanceRef.current} 
                routeData={currentRouteData}
                isDark={isDark}
                isMobile={isMobile}
                isFullscreen={isFullscreen}
            />
        </div>
    );
};

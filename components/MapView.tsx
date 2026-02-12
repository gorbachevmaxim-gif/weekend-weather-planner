import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import PlusIcon from "./icons/PlusIcon";
import MinusIcon from "./icons/MinusIcon";
import CenterIcon from "./icons/CenterIcon";
import EscIcon from "./icons/EscIcon";
import ExpandIcon from "./icons/ExpandIcon";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";
import { calculateElevationProfile, ElevationPoint } from "../utils/elevationUtils";
import ElevationProfile from "./ElevationProfile";
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
    hourlyWind?: number[];
    hourlyWindDir?: number[];
    isMountainRegion?: boolean;
}

const getWindDirectionText = (deg: number) => {
    const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
    return directions[index];
};

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

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus, markers, windDeg, windSpeed, windDirection, isDark = false, onFullscreenToggle, routeCount = 0, selectedRouteIdx = 0, onRouteSelect, pace = 25, startTemp, endTemp, elevationCursor, hourlyWind, hourlyWindDir, isMountainRegion = false }) => {
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [windPos, setWindPos] = useState<{ x: number; y: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [hoverInfo, setHoverInfo] = useState<ElevationPoint | null>(null);
    const [internalCursor, setInternalCursor] = useState<[number, number] | null>(null);

    const activeCursor = elevationCursor || internalCursor;

    const elevationData = useMemo(() => {
        if (!currentRouteData) return [];
        return calculateElevationProfile(
            currentRouteData.points, 
            currentRouteData.cumulativeDistances, 
            pace,
            isMountainRegion
        );
    }, [currentRouteData, pace, isMountainRegion]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const windDragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const isMountedRef = useRef(false);
    const handleCenterMapRef = useRef<(() => void) | null>(null);

    const handleZoomIn = useCallback(() => {
        mapInstanceRef.current?.zoomIn();
    }, []);

    const handleZoomOut = useCallback(() => {
        mapInstanceRef.current?.zoomOut();
    }, []);

    const toggleFullscreen = useCallback(() => {
        const elem = wrapperRef.current;
        if (!elem) return;

        const isNativeFullscreen = !!document.fullscreenElement;

        if (isFullscreen) {
            if (isNativeFullscreen) {
                document.exitFullscreen().catch(console.error);
            } else {
                setIsFullscreen(false);
                if (onFullscreenToggle) onFullscreenToggle(false);
            }
        } else {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {
                    // Fallback for iOS/unsupported
                    setIsFullscreen(true);
                    if (onFullscreenToggle) onFullscreenToggle(true);
                });
            } else {
                // Fallback for iOS/unsupported
                setIsFullscreen(true);
                if (onFullscreenToggle) onFullscreenToggle(true);
            }
        }
    }, [isFullscreen, onFullscreenToggle]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            // Only update if native fullscreen is active or we are exiting native fullscreen
            // This prevents interfering with pseudo-fullscreen if native event fires unexpectedly
            if (isFs) {
                setIsFullscreen(true);
                if (onFullscreenToggle) onFullscreenToggle(true);
            } else if (!isFs && document.fullscreenElement === null) {
                // Only reset if we were in native fullscreen? 
                // Actually, if we are in pseudo fullscreen, this event shouldn't fire.
                // But if it does, we check if we were expecting native.
                // Let's keep it simple: if event fires, sync state. 
                // EXCEPT if we are in pseudo-mode, we don't want to be kicked out by a rogue event?
                // But 'document.fullscreenElement' being null is the source of truth for NATIVE.
                
                // If we are using CSS fallback, we are NOT in native fullscreen.
                // So document.fullscreenElement is null.
                // If this event fires (it shouldn't), it would set isFullscreen(false).
                // That's acceptable.
                
                setIsFullscreen(false);
                if (onFullscreenToggle) onFullscreenToggle(false);
            }
        };

        const handleNativeChange = () => {
             const isFs = !!document.fullscreenElement;
             // If we entered native fullscreen, we must sync
             if (isFs) {
                 setIsFullscreen(true);
                 if (onFullscreenToggle) onFullscreenToggle(true);
             } 
             // If we exited native fullscreen
             else {
                 // But wait, if we are in pseudo-fullscreen, isFs is false.
                 // Do we want to exit pseudo-fullscreen if native fullscreen exits?
                 // Native fullscreen shouldn't "exit" if it wasn't active.
                 // So this is safe.
                 setIsFullscreen(false);
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
            : 'https://tiles.versatiles.org/assets/styles/graybeard/style.json';

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

        const hasData = currentRouteData?.points?.length && currentRouteData.points.length > 0;
        const coordinates = hasData 
            ? currentRouteData!.points.map(([lat, lon]) => [lon, lat]) 
            : [];

        // 1. Route Line GeoJSON
        const geoJson = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        };

        // 2. Endpoints (A/B) GeoJSON
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

        // Function to restore/add layers (called on style load/change)
        // Optimized to NOT update data if source exists
        const ensureLayers = () => {
            if (!map.getStyle()) return;

            let layersAdded = false;

            try {
                // Route Source & Layer
                if (!map.getSource('route')) {
                    if (hasData) {
                        map.addSource('route', { type: 'geojson', data: geoJson as any });
                    }
                }
                if (hasData && map.getSource('route') && !map.getLayer('route')) {
                    map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: 'route',
                        layout: { 
                            'line-join': 'round', 
                            'line-cap': 'round',
                            'visibility': 'visible'
                        },
                        paint: { 
                            'line-color': isDark ? '#CCCCCC' : '#444444', 
                            'line-width': 3,
                            'line-opacity': 1
                        }
                    });
                    layersAdded = true;
                }

                // Endpoints Source & Layers
                if (!map.getSource('endpoints')) {
                    if (hasData) {
                        map.addSource('endpoints', { type: 'geojson', data: endpointsGeoJson as any });
                    }
                }
                if (hasData && map.getSource('endpoints')) {
                    if (!map.getLayer('endpoints-bg')) {
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
                        layersAdded = true;
                    }
                    if (!map.getLayer('endpoints-label')) {
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
                            paint: { 'text-color': isDark ? '#333333' : '#ffffff' }
                        });
                        layersAdded = true;
                    }
                }
            } catch (e) {
                console.warn("Layer addition failed", e);
            }

            if (layersAdded) {
                // Ensure visibility after adding layers
                setTimeout(() => {
                    map.resize();
                    map.triggerRepaint();
                }, 50);
            }
        };

        // Function to update data (called when currentRouteData changes)
        const updateData = () => {
             const source = map.getSource('route') as maplibregl.GeoJSONSource;
             if (source) source.setData(geoJson as any);
             
             const epSource = map.getSource('endpoints') as maplibregl.GeoJSONSource;
             if (epSource) epSource.setData(endpointsGeoJson as any);
        };

        const onStyleData = () => {
            if (map.isStyleLoaded()) {
                ensureLayers();
            }
        };

        // Initial Logic
        if (map.isStyleLoaded() || map.loaded()) {
             // If source exists, we update data. If not, we ensure layers (which adds source with data).
             if (map.getSource('route')) {
                 updateData();
                 ensureLayers(); // Just in case layers are missing but source exists
             } else {
                 ensureLayers();
             }

             // Fit bounds logic - Only on data update/change
             if (hasData) {
                const canvas = map.getCanvas();
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    const bounds = new maplibregl.LngLatBounds();
                    coordinates.forEach(coord => bounds.extend(coord as [number, number]));
                    
                    let padding: any = isMobile 
                        ? { top: 50, bottom: 50, left: 55, right: 50 }
                        : 60;
                    if (isFullscreen) {
                        padding = {
                            top: isMobile ? 60 : 100,
                            bottom: isMobile ? 180 : 150,
                            left: 60,
                            right: 50
                        };
                    }

                    try {
                        map.fitBounds(bounds, { padding: padding, duration: 500 });
                    } catch (e) {
                        console.warn("fitBounds failed", e);
                    }
                }
             }
        } else {
            // Force ensureLayers once loaded
            map.once('load', () => {
                ensureLayers();
                // Also trigger fitBounds logic via update if needed? 
                // We can just rely on the fact that handleCenterMap will be called by ResizeObserver 
                // or we can explicitly call it here.
                if (hasData) {
                    const canvas = map.getCanvas();
                     if (canvas && canvas.width > 0 && canvas.height > 0) {
                        const bounds = new maplibregl.LngLatBounds();
                        coordinates.forEach(coord => bounds.extend(coord as [number, number]));
                        let padding: any = isMobile 
                            ? { top: 50, bottom: 50, left: 55, right: 50 }
                            : 60;
                        if (isFullscreen) {
                            padding = { top: isMobile ? 60 : 100, bottom: isMobile ? 180 : 150, left: 60, right: 50 };
                        }
                        try { map.fitBounds(bounds, { padding, duration: 500 }); } catch (e) {}
                     }
                }
            });
        }

        // Listen for style updates
        map.on('styledata', onStyleData);

        return () => {
            map.off('styledata', onStyleData);
        };
    }, [currentRouteData, isDark, isMobile, isFullscreen]);

    const markersRef = useRef<{ custom: maplibregl.Marker[] }>({ custom: [] });
    const cursorRef = useRef<maplibregl.Marker | null>(null);

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

            const color = isDark ? "#FFFFFF" : "#1E1E1E";
            const outlineColor = isDark ? "rgb(19, 13, 8)" : "rgb(243, 242, 242)";
            const outlinePath = `<path d="M12 19V5M5 12l7-7 7 7" stroke="${outlineColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`;
            const arrowHtml = `<div style="position: absolute; top: -33px; left: 50%; transform: translateX(-50%) rotate(180deg);"><svg width="27" height="27" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${outlinePath}<path d="M12 19V5M5 12l7-7 7 7" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></div>`;
                
                if (arrowWrapper.innerHTML !== arrowHtml) {
                     arrowWrapper.innerHTML = arrowHtml;
                }

                // Update transform
                arrowWrapper.style.transform = `rotate(${windDeg - rotation}deg)`;

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
    }, [activeCursor, isDark, isMobile, windDeg, rotation]);

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
                // Snap to nearest point
                closestIdx = t < 0.5 ? i : i + 1;
            }
        }

        if (closestIdx !== -1 && minDistSq < threshold * threshold) {
            setHoverInfo(elevationData[closestIdx]);
        } else {
            // If windPos is set (dragged) but far from track, we might still want to show something? 
            // Or just nothing.
            setHoverInfo(null);
        }

    }, [windPos, currentRouteData, pace, elevationData]);

    const handleProfileHover = useCallback((point: ElevationPoint | null) => {
        if (point) {
            setInternalCursor([point.lat, point.lon]);
            setHoverInfo(point);
            setWindPos(null);
        } else {
            setInternalCursor(null);
            setHoverInfo(null);
            setWindPos(null);
        }
    }, []);

    return (
        <div 
            ref={wrapperRef} 
            className={`${isFullscreen ? "fixed inset-0 z-[9999] h-[100dvh] rounded-none" : "relative w-full aspect-[4/3] md:aspect-[3/2] z-0 rounded-lg"} bg-slate-100 overflow-hidden transition-all duration-300`}
        >
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%", minHeight: "100%", filter: isDark ? "none" : "grayscale(100%)" }} /> 
            
            <div className="absolute top-0 right-0 z-10 px-1 text-black/50 text-[10px] pointer-events-auto font-sans">
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
                        externalHoverPoint={hoverInfo}
                        onHover={handleProfileHover}
                        targetSpeed={pace}
                        isMountainRegion={isMountainRegion}
                        startTemp={startTemp}
                        endTemp={endTemp}
                        hourlyWind={hourlyWind}
                        hourlyWindDir={hourlyWindDir}
                        tooltipOffset={2}
                    />
                </div>
            )}

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
                <button
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group"
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? (
                        <EscIcon isDark={isDark} width={28} height={28} />
                    ) : (
                        <ExpandIcon isDark={isDark} width={28} height={28} />
                    )}
                    {!isMobile && (
                        <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#1E1E1E] text-white"}`}>
                            <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#1E1E1E]"}`}></div>
                            {isFullscreen ? "Свернуть" : "Развернуть"}
                        </div>
                    )}
                </button>

                {!isMobile && (
                    <>
                        <button
                            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group"
                            onClick={handleZoomIn}
                        >
                            <PlusIcon isDark={isDark} width={28} height={28} />
                            <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#1E1E1E] text-white"}`}>
                                <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#1E1E1E]"}`}></div>
                                Поближе
                            </div>
                        </button>

                        <button
                            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group"
                            onClick={handleZoomOut}
                        >
                            <MinusIcon isDark={isDark} width={28} height={28} />
                            <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#1E1E1E] text-white"}`}>
                                <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#1E1E1E]"}`}></div>
                                Подальше
                            </div>
                        </button>
                    </>
                )}

                <button
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group"
                    onClick={handleCenterMap}
                >
                    <CenterIcon isDark={isDark} width={30} height={30} />
                    {!isMobile && (
                        <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#1E1E1E] text-white"}`}>
                            <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#1E1E1E]"}`}></div>
                            Центрировать
                        </div>
                    )}
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

            {/* Bottom-left controls - Hide in Fullscreen */}
            {!isFullscreen && (
                <div 
                    className={`absolute z-20 flex flex-col items-center p-[30px] ${windPos ? '' : '-left-[14px] bottom-[10px]'}`}
                    style={windPos ? { left: windPos.x, top: windPos.y } : undefined}
                    onMouseDown={handleWindMouseDown}
                    onTouchStart={handleWindMouseDown}
                >
                    {windDeg !== undefined && (
                    <div className="relative flex flex-col items-center w-8">
                        <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                        >
                            <svg 
                                width="26" 
                                height="26" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: `rotate(${windDeg + 180 - rotation}deg)` }}
                            >
                                <path d="M12 19V5M5 12l7-7 7 7" stroke={isDark ? "rgb(19, 13, 8)" : "rgb(243, 242, 242)"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 19V5M5 12l7-7 7 7" stroke={isDark ? "#FFFFFF" : "#1E1E1E"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                                className={`absolute ${getPlacementClasses(windDeg)} backdrop-blur rounded-md p-2 shadow-md pointer-events-none ${
                                    isDark ? "bg-[#888888] text-[#000000]" : "bg-white/90 text-black"
                                }`}
                            >
                                <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 font-medium text-xs font-sans whitespace-nowrap">
                                    <span>{Math.floor(hoverInfo.time)}:{(Math.round((hoverInfo.time - Math.floor(hoverInfo.time)) * 60)).toString().padStart(2, '0')}</span>
                                    <span>{hoverInfo.dist.toFixed(1)} км</span>
                                    
                                    <span>
                                        {startTemp !== undefined && endTemp !== undefined && elevationData.length > 0
                                            ? `${Math.round(startTemp + (endTemp - startTemp) * (hoverInfo.time / elevationData[elevationData.length-1].time))}°` 
                                            : ''}
                                    </span>
                                    <span>{Math.round(hoverInfo.speed)} км/ч</span>
                                    
                                    <span>{Math.round(hoverInfo.originalEle)} м</span>
                                    <span>+{Math.round(hoverInfo.realCumElevation)} м</span>

                                    <span>{Math.round(hoverInfo.gradient)}%</span>
                                    <span>
                                        {hourlyWind && hourlyWindDir && (
                                            <>
                                            {getWindDirectionText(hourlyWindDir[Math.min(Math.round(hoverInfo.time + 1), hourlyWindDir.length - 1)] || 0)} {Math.round(hourlyWind[Math.min(Math.round(hoverInfo.time + 1), hourlyWind.length - 1)] || 0)} км/ч
                                            </>
                                        )}
                                    </span>

                                    <span>
                                        -{Math.floor(Math.max(0, elevationData[elevationData.length-1].time - hoverInfo.time))}:{(Math.round((Math.max(0, elevationData[elevationData.length-1].time - hoverInfo.time) - Math.floor(Math.max(0, elevationData[elevationData.length-1].time - hoverInfo.time))) * 60)).toString().padStart(2, '0')}
                                    </span>
                                    <span>
                                        {Math.max(0, currentRouteData!.distanceKm - hoverInfo.dist).toFixed(1)} км
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            )}
        </div>
    );
};

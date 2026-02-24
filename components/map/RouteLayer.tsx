import React, { useEffect } from "react";
import maplibregl from "maplibre-gl";
import { RouteData } from "../../services/gpxUtils";

interface RouteLayerProps {
    map: maplibregl.Map | null;
    routeData?: RouteData;
    isDark: boolean;
    isMobile: boolean;
    isFullscreen: boolean;
}

const RouteLayer: React.FC<RouteLayerProps> = ({ map, routeData, isDark, isMobile, isFullscreen }) => {
    useEffect(() => {
        if (!map) return;

        const hasData = routeData?.points?.length && routeData.points.length > 0;
        const coordinates = hasData 
            ? routeData!.points.map(([lat, lon]) => [lon, lat]) 
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
                    geometry: { type: 'Point', coordinates: [routeData!.points[0][1], routeData!.points[0][0]] }
                });
                endpointsFeatures.push({
                    type: 'Feature',
                    properties: { label: 'B' },
                    geometry: { type: 'Point', coordinates: [routeData!.points[routeData!.points.length-1][1], routeData!.points[routeData!.points.length-1][0]] }
                });
        }
        const endpointsGeoJson = { type: 'FeatureCollection', features: endpointsFeatures };

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
                setTimeout(() => {
                    map.resize();
                    map.triggerRepaint();
                }, 50);
            }
        };

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

        if (map.isStyleLoaded() || map.loaded()) {
             if (map.getSource('route')) {
                 updateData();
                 ensureLayers();
             } else {
                 ensureLayers();
             }

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
            map.once('load', () => {
                ensureLayers();
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

        map.on('styledata', onStyleData);

        return () => {
            map.off('styledata', onStyleData);
        };
    }, [map, routeData, isDark, isMobile, isFullscreen]);

    return null;
};

export default RouteLayer;

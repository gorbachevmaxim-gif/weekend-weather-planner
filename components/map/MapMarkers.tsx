import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

interface MarkerData {
    coords: [number, number]; // [lat, lon]
    label: string;
}

interface MapMarkersProps {
    map: maplibregl.Map | null;
    markers?: MarkerData[];
}

const MapMarkers: React.FC<MapMarkersProps> = ({ map, markers }) => {
    const markersRef = useRef<maplibregl.Marker[]>([]);

    useEffect(() => {
        if (!map) return;

        const updateCustomMarkers = () => {
             // Custom Markers (Full rebuild)
             markersRef.current.forEach(m => m.remove());
             markersRef.current = [];

             markers?.forEach(m => {
                const el = document.createElement('div');
                el.style.cssText = "background-color: white; padding: 2px 6px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap; font-size: 11px; font-weight: bold; color: black; font-family: sans-serif; margin-bottom: 4px;";
                el.innerText = m.label;
                const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([m.coords[1], m.coords[0]])
                    .addTo(map);
                markersRef.current.push(marker);
            });
        };

        if (map.loaded()) {
            updateCustomMarkers();
        } else {
            map.on('load', updateCustomMarkers);
        }

        return () => {
            map.off('load', updateCustomMarkers);
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];
        };
    }, [map, markers]);

    return null;
};

export default MapMarkers;

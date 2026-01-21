import React, { useEffect, useRef } from "react";
import * as L from "leaflet";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";

interface MapViewProps {
    cityCoords: CityCoordinates;
    currentRouteData?: RouteData;
    routeStatus: string;
}

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || !cityCoords) return;
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                scrollWheelZoom: false,
                dragging: !L.Browser.mobile,
                touchZoom: true,
                doubleClickZoom: true,
                zoomControl: false
            });
            L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);
            mapInstanceRef.current = map;
            setTimeout(() => map.invalidateSize(), 100);
        }
        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } }
    }, [cityCoords]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;
        map.invalidateSize();
        if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }

        if (currentRouteData?.points.length) {
            const polyline = L.polyline(currentRouteData.points, { color: "black", weight: 3, opacity: 0.9 }).addTo(map);
            polylineRef.current = polyline;

            setTimeout(() => {
                const bounds = polyline.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: false });
                }
            }, 100);
        } else if (routeStatus !== "Поиск...") {
            map.setView([cityCoords.lat, cityCoords.lon], 11);
        }
    }, [cityCoords, currentRouteData, routeStatus]);

    return (
        <div className="relative w-full h-[250px] bg-slate-100 z-.0">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-2 left-2 z-[1000] bg-white p-1 rounded-full shadow flex">
                <button className="px-2 text-lg">+</button>
                <button className="px-2 text-lg">-</button>
            </div>
        </div>
    );
};

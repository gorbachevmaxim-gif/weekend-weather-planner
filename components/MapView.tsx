import React, { useEffect, useMemo, useRef } from "react";
import Map, { Source, Layer, NavigationControl, MapRef, Marker } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { RouteData } from "../services/gpxUtils";
import { CityCoordinates } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

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

const MAPBOX_TOKEN = "pk.eyJ1IjoiZ29yYmllIiwiYSI6ImNtazhtcGtjbDFnb3QzZ3Exbm4ybjNmMXMifQ._zGWX07nBhvxyJmke98snA";

export const MapView: React.FC<MapViewProps> = ({ cityCoords, currentRouteData, routeStatus, markers, windDeg, windSpeed, windDirection }) => {
    const mapRef = useRef<MapRef>(null);

    const geoJsonData = useMemo(() => {
        if (!currentRouteData?.points?.length) return null;
        
        // Convert [lat, lon] to [lon, lat] for GeoJSON
        const coordinates = currentRouteData.points.map(([lat, lon]) => [lon, lat]);

        return {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: coordinates
            },
            properties: {}
        } as GeoJSON.Feature<GeoJSON.LineString>;
    }, [currentRouteData]);

    useEffect(() => {
        if (!mapRef.current) return;

        if (geoJsonData) {
            const bounds = new mapboxgl.LngLatBounds();
            geoJsonData.geometry.coordinates.forEach((coord) => {
                bounds.extend(coord as [number, number]);
            });

            // Delay slightly to ensure map is ready
            setTimeout(() => {
                 if (mapRef.current) {
                    mapRef.current.fitBounds(bounds, {
                        padding: 60,
                        maxZoom: 13,
                        animate: false
                    });
                 }
            }, 100);
        } else if (routeStatus !== "Поиск...") {
             mapRef.current.flyTo({
                center: [cityCoords.lon, cityCoords.lat],
                zoom: 11,
                animate: true
            });
        }
    }, [geoJsonData, routeStatus, cityCoords.lon, cityCoords.lat]);

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
        <div className="relative w-full aspect-square bg-slate-100 z-0 rounded-lg overflow-hidden">
             <Map
                ref={mapRef}
                initialViewState={{
                    longitude: cityCoords.lon,
                    latitude: cityCoords.lat,
                    zoom: 11
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                scrollZoom={false}
                attributionControl={false}
            >
                <NavigationControl position="top-left" showCompass={false} />
                
                {geoJsonData && (
                    <Source id="route-source" type="geojson" data={geoJsonData}>
                        <Layer
                            id="route-layer"
                            type="line"
                            paint={{
                                "line-color": "black",
                                "line-width": 3,
                                "line-opacity": 0.9
                            }}
                        />
                    </Source>
                )}

                {currentRouteData?.points?.[0] && (
                    <Marker
                        longitude={currentRouteData.points[0][1]}
                        latitude={currentRouteData.points[0][0]}
                        anchor="center"
                    >
                        <div className="flex items-center justify-center w-6 h-6 bg-black rounded-full text-white text-xs font-bold shadow-md">
                            A
                        </div>
                    </Marker>
                )}

                {currentRouteData?.points?.[currentRouteData.points.length - 1] && (
                    <Marker
                        longitude={currentRouteData.points[currentRouteData.points.length - 1][1]}
                        latitude={currentRouteData.points[currentRouteData.points.length - 1][0]}
                        anchor="center"
                    >
                        <div className="flex items-center justify-center w-6 h-6 bg-black rounded-full text-white text-xs font-bold shadow-md">
                            B
                        </div>
                    </Marker>
                )}

                {markers?.map((marker, index) => (
                    <Marker
                        key={index}
                        longitude={marker.coords[1]}
                        latitude={marker.coords[0]}
                        anchor="bottom"
                    >
                        <div style={{
                            backgroundColor: "white",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            whiteSpace: "nowrap",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "black",
                            fontFamily: "sans-serif",
                            marginBottom: "4px"
                        }}>
                            {marker.label}
                        </div>
                    </Marker>
                ))}
            </Map>
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

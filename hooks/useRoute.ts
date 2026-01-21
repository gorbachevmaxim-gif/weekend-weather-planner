import { useState, useEffect } from "react";
import { CityAnalysisResult } from "../types";
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from "../constants";
import { getCardinal } from "../services/weatherService";
import { parseGpx, RouteData } from "../services/gpxUtils";

interface FoundRoute {
    routeData: RouteData;
    gpxString: string;
}

export const useRoute = (
    activeStats: CityAnalysisResult['weekend1']['saturday'],
    cityName: string
) => {
    const [routeStatus, setRouteStatus] = useState<string>("");
    const [foundRoutes, setFoundRoutes] = useState<FoundRoute[]>([]);
    const cityCoords = CITIES[cityName];
    const isFlightDestination = FLIGHT_CITIES.includes(cityName);

    useEffect(() => {
        let isMounted = true;
        if (!activeStats || !cityCoords) return;

        if (isFlightDestination) {
            setRouteStatus("Авианаправление");
            setFoundRoutes([]);
            return;
        }

        const windDirCode = getCardinal(activeStats.windDeg);
        setRouteStatus("Поиск...");
        setFoundRoutes([]);

        const fileCityName = CITY_FILENAMES[cityName] || cityName;
        const baseName = `routes/${fileCityName}_${windDirCode}`;
        const candidates = [`${baseName}.gpx`, `${baseName}_1.gpx`, `${baseName}_2.gpx`, `${baseName}_3.gpx`];

        Promise.all(candidates.map(url =>
            fetch(`${url}?t=${Date.now()}`).then(r => r.ok ? r.text() : Promise.resolve(null))
        ))
            .then(gpxStrings => {
                if (!isMounted) return;
                const validRoutes: FoundRoute[] = gpxStrings
                    .map(gpxString => {
                        if (!gpxString) return null;
                        const routeData = parseGpx(gpxString);
                        if (!routeData) return null;
                        return { routeData, gpxString };
                    })
                    .filter((r): r is FoundRoute => r !== null);

                if (validRoutes.length > 0) {
                    setFoundRoutes(validRoutes);
                    setRouteStatus(`Найдено маршрутов: ${validRoutes.length}`);
                } else {
                    setFoundRoutes([]);
                    setRouteStatus(`Маршрут под ${activeStats.windDirFull.toLowerCase()} ветер не сделан`);
                }
            });
        return () => { isMounted = false; };
    }, [activeStats, cityCoords, cityName, isFlightDestination]);

    return { routeStatus, foundRoutes };
};

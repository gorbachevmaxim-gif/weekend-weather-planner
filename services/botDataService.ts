import { analyzeCity, getWeekendDates } from './weatherService';
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from '../config/constants';
import { CITY_ROUTES } from '../config/routes';
import { getCardinal } from './weatherService';
import { parseGpx, getDistanceFromLatLonInKm } from './gpxUtils';
import { getStationName, getMoscowStationName, generateTransportLink } from '../utils/transportUtils';
import { getDifficultyLabel, getDistanceLabel } from '../utils/elevationUtils';

export async function generateBotData() {
    const targetDates = getWeekendDates();
    const allRides = [];

    // Evaluate all cities
    for (const [cityName, coords] of Object.entries(CITIES)) {
        if (FLIGHT_CITIES.includes(cityName)) continue; // skip flight cities for bot for now

        const analysis = await analyzeCity(cityName, coords, targetDates);
        if (!analysis) continue;

        const availableDays = [
            analysis.weekend1.saturday,
            analysis.weekend1.sunday,
            analysis.weekend2.saturday,
            analysis.weekend2.sunday,
            ...analysis.extraDays
        ].filter(d => d && d.isRideable && d.hasRoute);

        for (const day of availableDays) {
            if (!day) continue;
            const windDirCode = getCardinal(day.windDeg);
            const fileCityName = CITY_FILENAMES[cityName] || cityName;
            const availableRoutes = CITY_ROUTES[fileCityName] || [];
            const matchingRoute = availableRoutes.find(r => r.direction === windDirCode);

            if (!matchingRoute) continue;

            const url = `routes/${matchingRoute.filename}`;
            const gpxUrl = `https://weekend-weather-planner.vercel.app/${url}`;

            // Parse gpx text locally if possible or fetch from deployment URL.
            // In serverless environment, local fetch to relative path is hard, so we assume deployment URL.
            // Actually, we can just use the public folder if we have access, but for Vercel functions
            // we will fetch from the public URL.
            let routeData = null;
            try {
                const res = await fetch(gpxUrl);
                if (res.ok) {
                    const text = await res.text();
                    routeData = parseGpx(text);
                }
            } catch (e) {
                console.error("Failed to fetch GPX for bot:", e);
            }

            if (!routeData) continue;

            const speed = 30;
            const distance = routeData.distanceKm;
            const elevation = routeData.elevationM;
            const durationMinutes = Math.round((distance / speed) * 60);
            const durationHours = Math.floor(durationMinutes / 60);
            const durationRemainderMinutes = durationMinutes % 60;
            const saddleTime = `${String(durationHours).padStart(2, "0")}:${String(durationRemainderMinutes).padStart(2, "0")}`;

            const bidons = Math.ceil(durationMinutes / 80);
            const gels = Math.ceil(durationMinutes / 40);

            let routeStartLat = coords.lat;
            let routeStartLon = coords.lon;
            let routeEndLat = coords.lat;
            let routeEndLon = coords.lon;

            if (routeData.points.length > 0) {
                routeStartLat = routeData.points[0][0];
                routeStartLon = routeData.points[0][1];
                const lastIdx = routeData.points.length - 1;
                routeEndLat = routeData.points[lastIdx][0];
                routeEndLon = routeData.points[lastIdx][1];
            }

            const findClosestCityName = (lat: number, lon: number) => {
                let closestName = cityName;
                let minD = Infinity;
                for (const [name, c] of Object.entries(CITIES)) {
                    const d = getDistanceFromLatLonInKm(lat, lon, c.lat, c.lon);
                    if (d < minD) { minD = d; closestName = name; }
                }
                return closestName;
            };

            const routeStartCity = findClosestCityName(routeStartLat, routeStartLon);
            const routeEndCity = findClosestCityName(routeEndLat, routeEndLon);

            const toLink = routeStartCity !== "Москва" ? generateTransportLink("Москва", routeStartCity, day.dateObj) : "";
            const fromLink = routeEndCity !== "Москва" ? generateTransportLink(routeEndCity, "Москва", day.dateObj) : "";

            const foodStartLink = routeStartCity === "Завидово" 
                ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" 
                : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeStartCity)}`;
            const foodEndLink = routeEndCity === "Завидово" 
                ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" 
                : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeEndCity)}`;

            allRides.push({
                date: day.dateStr,
                dayName: day.dayName,
                routeName: `${routeStartCity}—${routeEndCity}`,
                gpxUrl: gpxUrl,
                routeParams: {
                    distance: Math.round(distance),
                    elevationGain: Math.round(elevation),
                    pace: speed,
                    saddleTime: saddleTime
                },
                weatherParams: {
                    temperature: day.tempRange,
                    feelsLike: day.feelsRange,
                    wind: `${day.windDirection} ${day.windRange} км/ч`,
                    gusts: day.windGusts,
                    precipitation: day.precipSum,
                    precipitationRisk: day.precipitationProbability,
                    sunshine: day.sunStr
                },
                analysis: {
                    transport: {
                        to: toLink,
                        from: fromLink
                    },
                    clothing: day.clothingHints.join(", "),
                    profile: {
                        score: day.profileScore,
                        difficulty: day.profileScore ? getDifficultyLabel(day.profileScore) : "",
                        distanceRank: getDistanceLabel(distance),
                        speedRank: distance > 160 ? "Темповой" : "Прогулочный"
                    },
                    food: {
                        start: foodStartLink,
                        end: foodEndLink
                    },
                    nutrition: {
                        bidons,
                        gels
                    }
                }
            });
        }
    }

    return allRides;
}

import { CityCoordinates } from '../types.js';

interface RouteData {
    points: [number, number, number][];
    distanceKm: number;
    elevationM: number;
    cumulativeDistances: number[];
}

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (d: number) => d * Math.PI / 180;
    const toDeg = (r: number) => r * 180 / Math.PI;
    const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
};

const parseGpx = (str: string): RouteData | null => {
    try {
        const points: [number, number, number][] = [];
        const cumulativeDistances: number[] = [0];
        let totalDist = 0;
        let totalElev = 0;
        let prevLat = 0, prevLon = 0, prevEle = -10000;

        // RegExp to handle both browser and Node environments (DOMParser is browser only)
        // Matches <trkpt lat="..." lon="...">...</trkpt> or <rtept ...>...</rtept>
        const ptRegex = /<(?:trkpt|rtept)\s+lat="([^"]+)"\s+lon="([^"]+)">([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
        const eleRegex = /<ele>([^<]+)<\/ele>/i;
        
        let match;
        let index = 0;
        while ((match = ptRegex.exec(str)) !== null) {
            const latStr = match[1];
            const lonStr = match[2];
            const innerContent = match[3];
            
            const lat = parseFloat(latStr);
            const lon = parseFloat(lonStr);
            let ele = NaN;
            
            const eleMatch = eleRegex.exec(innerContent);
            if (eleMatch && eleMatch[1]) {
                ele = parseFloat(eleMatch[1]);
            }

            if (!isNaN(lat) && !isNaN(lon)) {
                points.push([lat, lon, isNaN(ele) ? 0 : ele]);
                if (index > 0) {
                    const dist = getDistanceFromLatLonInKm(prevLat, prevLon, lat, lon);
                    totalDist += dist;
                    cumulativeDistances.push(totalDist);
                    if (!isNaN(ele) && prevEle !== -10000 && ele - prevEle > 0) totalElev += (ele - prevEle);
                }
                prevLat = lat; prevLon = lon; if (!isNaN(ele)) prevEle = ele;
                index++;
            }
        }
        
        if (points.length === 0) return null;
        return { points, distanceKm: totalDist, elevationM: totalElev, cumulativeDistances };
    } catch (e) { return null; }
};

// Export the functions and interface
export { parseGpx, getDistanceFromLatLonInKm, getBearing };
export type { RouteData };

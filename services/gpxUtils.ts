import { CityCoordinates } from '../types';

interface RouteData {
    points: [number, number][];
    distanceKm: number;
    elevationM: number;
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
        const parser = new DOMParser();
        const xml = parser.parseFromString(str, "text/xml");
        if (xml.querySelector('parsererror')) return null;
        const getAttr = (el: Element, name: string) => {
            const val = el.getAttribute(name);
            return val ? parseFloat(val) : NaN;
        };
        const allElements = Array.from(xml.getElementsByTagName('*'));
        let pointsElements = allElements.filter(el => (el.localName === 'trkpt' || el.nodeName === 'trkpt'));
        if (pointsElements.length === 0) pointsElements = allElements.filter(el => (el.localName === 'rtept' || el.nodeName === 'rtept'));
        if (pointsElements.length === 0) return null;
        const points: [number, number][] = [];
        let totalDist = 0;
        let totalElev = 0;
        let prevLat = 0, prevLon = 0, prevEle = -10000;
        pointsElements.forEach((pt, index) => {
            const lat = getAttr(pt, 'lat');
            const lon = getAttr(pt, 'lon');
            let ele = NaN;
            const children = Array.from(pt.children);
            const eleNode = children.find(c => c.localName === 'ele' || c.nodeName === 'ele');
            if (eleNode && eleNode.textContent) ele = parseFloat(eleNode.textContent);
            if (!isNaN(lat) && !isNaN(lon)) {
                points.push([lat, lon]);
                if (index > 0) {
                    totalDist += getDistanceFromLatLonInKm(prevLat, prevLon, lat, lon);
                    if (!isNaN(ele) && prevEle !== -10000 && ele - prevEle > 0) totalElev += (ele - prevEle);
                }
                prevLat = lat; prevLon = lon; if (!isNaN(ele)) prevEle = ele;
            }
        });
        if (points.length === 0) return null;
        return { points, distanceKm: totalDist, elevationM: totalElev };
    } catch (e) { return null; }
};

// Export the functions and interface
export { parseGpx, getDistanceFromLatLonInKm, getBearing };
export type { RouteData };

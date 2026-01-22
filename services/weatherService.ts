async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i < retries - 1) {
                console.warn(`Retry attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`, error.message);
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Retry failed");
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

  import { API_URL, CITY_FILENAMES, FLIGHT_CITIES } from '../constants';
  import { parseGpx, RouteData } from './gpxUtils';
  import { CityCoordinates, CityAnalysisResult, WeatherDayStats } from '../types';

  export const MOUNTAIN_CITIES: string[] = ["Кемер", "Фетхие"];

  function toLocalISODate(d: Date): string {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
  }

  export const getCardinal = (angle: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return directions[index];
  };

  function degToCompass(num: number | null): string {
      if (num === null) return "";
      const angle = (num % 360 + 360) % 360;
      const val = Math.round(angle / 45);
      const arr = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
      return arr[(val % 8)];
  }

  function degToCompassFull(num: number | null): string {
      if (num === null) return "";
      const angle = (num % 360 + 360) % 360;
      const val = Math.round(angle / 45);
      const arr = ["Северный", "Северо-Восточный", "Восточный", "Юго-Восточный", "Южный", "Юго-Западный", "Западный", "Северо-Западный"];
      return arr[(val % 8)];
  }

  function formatSunTime(seconds: number): string {
      if (seconds <= 0) return "0 ч 0 мин";
      let cappedSeconds = Math.min(seconds, 9 * 3600);
      const hours = Math.floor(cappedSeconds / 3600);
      const minutes = Math.floor((cappedSeconds % 3600) / 60);
      return `${hours} ч ${minutes} мин`;
  }

  function formatRainHours(hours: number[]): string | null {
      if (!hours || hours.length === 0) return null;
      hours.sort((a, b) => a - b);
      const groups: number[][] = [];
      let currentGroup: number[] = [hours[0]];
      for (let i = 1; i < hours.length; i++) {
          if (hours[i] === hours[i - 1] + 1) {
              currentGroup.push(hours[i]);
          } else {
              groups.push(currentGroup);
              currentGroup = [hours[i]];
          }
      }
      groups.push(currentGroup);
      const parts = groups.map(g => {
          const start = g[0];
          const end = g[g.length - 1];
          if (start === end) return `${start.toString().padStart(2, "0")}:00`;
          return `${start.toString().padStart(2, "0")}:00–${(end + 1).toString().padStart(2, "0")}:00`;
      });
      return parts.join(", ");
  }

  export function getWeekendDates(): Date[] {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const dayOfWeek = today.getDay();
      let sat1: Date;
      if (dayOfWeek === 6) {
          sat1 = new Date(today);
      } else {
          const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
          sat1 = new Date(today);
          sat1.setDate(today.getDate() + (dayOfWeek === 6 ? 0 : daysUntilSat));
      }
      const sun1 = new Date(sat1); sun1.setDate(sat1.getDate() + 1);
      const sat2 = new Date(sat1); sat2.setDate(sat1.getDate() + 7);
      const sun2 = new Date(sat2); sun2.setDate(sat2.getDate() + 1);
      return [sat1, sun1, sat2, sun2];
  }

  function getClothingRecommendations(
      tMin: number,
      tMax: number,
      wMax: number,
      activeRainSum: number,
      temps09_11: number[],
      temps11_18: number[],
      temps09_12: number[],
      temps12_18: number[],
      cityName: string,
      isMorningRideSuitable: boolean
  ): string[] {
      const hints: string[] = [];
      const isMountain = MOUNTAIN_CITIES.includes(cityName);

      if (tMax < 5) return [];
      if (activeRainSum > 0.5 && !isMorningRideSuitable) return [];

      let useArmWarmers = false;
      if (temps09_11.length && temps11_18.length) {
          const minStart = Math.min(...temps09_11);
          const maxEnd = Math.max(...temps11_18);
          if (minStart < 16 && maxEnd > 19) useArmWarmers = true;
      }

      if (tMax < 14) hints.push("Bib Tights");
      else hints.push("Bib Shorts");

      if (tMax >= 14 && tMax <= 19) hints.push("Leg or Knee Warmers");

      let jersey = "";
      if (tMax < 15) jersey = "Long Sleeve Jersey Cold";
      else if (tMax >= 15 && tMax <= 22) jersey = "Long Sleeve Jersey Hot";
      else jersey = "Jersey";

      if (useArmWarmers && jersey === "Long Sleeve Jersey Hot") jersey = "Jersey";

      let outerLayer = "";
      const needsProtection = tMin < 12 || wMax > 15 || (tMax > 10 && tMax <= 20);
      if (needsProtection) {
          if (wMax >= 15 || isMountain) outerLayer = "Jacket";
          else outerLayer = "Vest";
      }

      if (tMax <= 8) hints.push("Winter Jacket");
      else {
          if (jersey) hints.push(jersey);
          if (outerLayer) hints.push(outerLayer);
      }

      if (useArmWarmers) hints.push("Arm Warmers");
      if (tMin <= 8) hints.push("Oversocks");
      else if (tMin <= 14) hints.push("Toe covers");
      if (tMin <= 8) hints.push("Buff");

      return [...new Set(hints)];
  }

  async function checkRouteAvailability(cityName: string, windDeg: number): Promise<RouteData | null> {
      const fileCityName = CITY_FILENAMES[cityName] || cityName;
      const windDirCode = getCardinal(windDeg);
      const baseName = `routes/${fileCityName}_${windDirCode}`;
      const candidates = [`${baseName}.gpx`, `${baseName}_1.gpx`, `${baseName}_2.gpx`, `${baseName}_3.gpx`];

      try {
          const routePromises = candidates.map(async (url) => {
              try {
                  const cacheBustedUrl = `${url}?t=${Date.now()}`;
                  const res = await fetch(cacheBustedUrl, { method: "GET" });
                  if (res.ok) {
                      const gpxText = await res.text();
                      return parseGpx(gpxText);
                  }
                  return null;
              } catch (e) {
                  // console.warn(`Failed to fetch or parse GPX from ${url}`, e);
                  return null;
              }
          });
          const results = await Promise.all(routePromises);
          // Return the first valid route found
          for (const route of results) {
              if (route) return route;
          }
          return null;
      } catch (e) {
          console.warn("Route check error", e);
          return null;
      }
  }

  export async function analyzeCity(cityName: string, coords: CityCoordinates, targetDates: Date[]): Promise<CityAnalysisResult | null> {
      const startStr = toLocalISODate(targetDates[0]);
      const endStr = toLocalISODate(targetDates[targetDates.length - 1]);
      const params = new URLSearchParams({
          latitude: coords.lat.toString(),
          longitude: coords.lon.toString(),
          start_date: startStr,
          end_date: endStr,
          hourly: "precipitation,precipitation_probability,temperature_2m,wind_speed_10m,wind_gusts_10m,apparent_temperature,wind_direction_10m,sunshine_duration,temperature_900hPa,temperature_850hPa",
          timezone: "Europe/Moscow"
      });

      try {
          const response = await retry(async () => {
              const res = await fetchWithTimeout(`${API_URL}?${params.toString()}`);
              if (!res.ok) throw new Error(`API Error: ${res.status}`);
              return res;
          });
          const data = await response.json();
          const hourly = data.hourly;
          const result: CityAnalysisResult = {
              cityName,
              weekend1: { saturday: null, sunday: null },
              weekend2: { saturday: null, sunday: null }
          };
          const baseTime = targetDates[0].getTime();

          const promises = targetDates.map(async (targetDate, index) => {
              const tStr = toLocalISODate(targetDate);
              const targetTime = targetDate.getTime();
              const diffTime = targetTime - baseTime;
              const dayOffset = Math.round(diffTime / (1000 * 3600 * 24));
              const sIdx = dayOffset * 24;
              const eIdx = sIdx + 24;

              if (!hourly.precipitation || hourly.precipitation.length < eIdx) return;

              const pSlice = hourly.precipitation.slice(sIdx + 4, eIdx) as number[];
              const totalRain = pSlice.reduce((a: number, b: number) => a + (b || 0), 0);
              const wetHours = pSlice.map((val: number, i: number) => (val > 0.1 ? i + 4 : -1)).filter((h: number) => h !== -1);
              const precipitationProbabilitySlice = hourly.precipitation_probability.slice(sIdx + 4, eIdx) as number[];
              const precipitationProbability = Math.max(...precipitationProbabilitySlice);


              const actStart = sIdx + 9;
              const actEnd = sIdx + 18;
              const sunSlice = hourly.sunshine_duration.slice(actStart, actEnd) as number[];
              const sunVal = sunSlice.reduce((a: number, b: number) => a + (b || 0), 0);

              const tempSlice = hourly.temperature_2m.slice(actStart, actEnd) as number[];
              const feelsSlice = hourly.apparent_temperature.slice(actStart, actEnd) as number[];
              const windSlice = hourly.wind_speed_10m.slice(actStart, actEnd) as number[];
              const windGustSlice = hourly.wind_gusts_10m.slice(actStart, actEnd) as number[];
              const windDirSlice = hourly.wind_direction_10m.slice(actStart, actEnd) as number[];
              
              // Mountain temps (1000m and 1500m) 10:00 to 17:00
              const temp900hPaSlice = hourly.temperature_900hPa.slice(sIdx + 10, sIdx + 18) as number[];
              const temp850hPaSlice = hourly.temperature_850hPa.slice(sIdx + 10, sIdx + 18) as number[];

              const pActiveSlice = hourly.precipitation.slice(actStart, actEnd) as number[];
              const activeRainSum = pActiveSlice.reduce((a: number, b: number) => a + (b || 0), 0);

              const pMorningSlice = hourly.precipitation.slice(sIdx + 9, sIdx + 12) as number[];
              const morningRainSum = pMorningSlice.reduce((a: number, b: number) => a + (b || 0), 0);
              const isMorningRideSuitable = morningRainSum <= 0.1;

              const tMin = tempSlice.length ? Math.min(...tempSlice) : 0;
              const tMax = tempSlice.length ? Math.max(...tempSlice) : 0;
              const fMin = feelsSlice.length ? Math.min(...feelsSlice) : 0;
              const fMax = feelsSlice.length ? Math.max(...feelsSlice) : 0;
              const wMin = windSlice.length ? Math.min(...windSlice) : 0;
              const wMax = windSlice.length ? Math.max(...windSlice) : 0;
              const gMax = windGustSlice.length ? Math.max(...windGustSlice) : 0;
              const temp900hPaMin = temp900hPaSlice.length ? Math.min(...temp900hPaSlice) : 0;
              const temp850hPaMin = temp850hPaSlice.length ? Math.min(...temp850hPaSlice) : 0;

              let windDirStr = "";
              let windDirFullStr = "";
              let windDeg = 0;
              if (windSlice.length > 0) {
                  const maxWindIdx = windSlice.indexOf(wMax);
                  windDeg = windDirSlice[maxWindIdx] || 0;
                  windDirStr = degToCompass(windDeg);
                  windDirFullStr = degToCompassFull(windDeg);
              }

              const temps09_11 = hourly.temperature_2m.slice(sIdx + 9, sIdx + 12) as number[];
              const temps11_18 = hourly.temperature_2m.slice(sIdx + 11, sIdx + 19) as number[];
              const temps09_12 = hourly.temperature_2m.slice(sIdx + 9, sIdx + 13) as number[];
              const temps12_18 = hourly.temperature_2m.slice(sIdx + 12, sIdx + 19) as number[];

              const clothingHints = getClothingRecommendations(
                  tMin, tMax, wMax, activeRainSum,
                  temps09_11, temps11_18, temps09_12, temps12_18,
                  cityName,
                  isMorningRideSuitable
              );

                     
                        const isDry = activeRainSum <= 0.5;
                        let hasRoute = false;
                        let rideDuration: string | undefined = undefined;
                        let startTemperature: number | undefined = undefined;
                        let endTemperature: number | undefined = undefined;
                        let startTemperature900hPa: number | undefined = undefined;
                        let endTemperature900hPa: number | undefined = undefined;
                        let startTemperature850hPa: number | undefined = undefined;
                        let endTemperature850hPa: number | undefined = undefined;
            
                        if (isDry) {
                            if (FLIGHT_CITIES.includes(cityName)) {
                                hasRoute = true;
                                const estimatedRideHours = 3;
                                const estimatedRideMinutes = 0;
                                rideDuration = `${String(estimatedRideHours).padStart(2, "0")}:${String(estimatedRideMinutes).padStart(2, "0")}`;
            
                                startTemperature = hourly.temperature_2m[sIdx + 10] !== undefined ? Math.round(hourly.temperature_2m[sIdx + 10]) : undefined;
                                endTemperature = hourly.temperature_2m[sIdx + 10 + estimatedRideHours] !== undefined ? Math.round(hourly.temperature_2m[sIdx + 10 + estimatedRideHours]) : undefined;
                                startTemperature900hPa = hourly.temperature_900hPa[sIdx + 10] !== undefined ? Math.round(hourly.temperature_900hPa[sIdx + 10]) : undefined;
                                endTemperature900hPa = hourly.temperature_900hPa[sIdx + 10 + estimatedRideHours] !== undefined ? Math.round(hourly.temperature_900hPa[sIdx + 10 + estimatedRideHours]) : undefined;
                                startTemperature850hPa = hourly.temperature_850hPa[sIdx + 10] !== undefined ? Math.round(hourly.temperature_850hPa[sIdx + 10]) : undefined;
                                endTemperature850hPa = hourly.temperature_850hPa[sIdx + 10 + estimatedRideHours] !== undefined ? Math.round(hourly.temperature_850hPa[sIdx + 10 + estimatedRideHours]) : undefined;
                            } else {
                                const routeData = await checkRouteAvailability(cityName, windDeg);
                                if (routeData) {
                                    hasRoute = true;
                                    const estimatedRideHours = Math.floor(routeData.distanceKm / 30);
                                    const estimatedRideMinutes = Math.round((routeData.distanceKm / 30 - estimatedRideHours) * 60);
                                    rideDuration = `${String(estimatedRideHours).padStart(2, "0")}:${String(estimatedRideMinutes).padStart(2, "0")}`;
            
                                    startTemperature = hourly.temperature_2m[sIdx + 10] !== undefined ? Math.round(hourly.temperature_2m[sIdx + 10]) : undefined;
                                    const totalRideHoursForIndex = estimatedRideHours + Math.floor(estimatedRideMinutes / 60);
                                    const finalHourIndex = sIdx + 10 + totalRideHoursForIndex;
                                    endTemperature = hourly.temperature_2m[finalHourIndex] !== undefined ? Math.round(hourly.temperature_2m[finalHourIndex]) : undefined;
                                    startTemperature900hPa = hourly.temperature_900hPa[sIdx + 10] !== undefined ? Math.round(hourly.temperature_900hPa[sIdx + 10]) : undefined;
                                    endTemperature900hPa = hourly.temperature_900hPa[finalHourIndex] !== undefined ? Math.round(hourly.temperature_900hPa[finalHourIndex]) : undefined;
                                    startTemperature850hPa = hourly.temperature_850hPa[sIdx + 10] !== undefined ? Math.round(hourly.temperature_850hPa[sIdx + 10]) : undefined;
                                    endTemperature850hPa = hourly.temperature_850hPa[finalHourIndex] !== undefined ? Math.round(hourly.temperature_850hPa[finalHourIndex]) : undefined;
                                }
                            }
                        }
            const dayStats: WeatherDayStats = {
                  dateObj: targetDate,
                  dateStr: tStr,
                  dayName: targetDate.getDay() === 6 ? "Суббота" : "Воскресенье",
                  isDry: isDry,
                  isMorningRideSuitable: isMorningRideSuitable,
                  hasRoute: hasRoute,
                  precipSum: totalRain,
                  precipitationProbability: precipitationProbability,
                  rainHours: formatRainHours(wetHours),
                  tempRange: `${Math.round(tMin)}..${Math.round(tMax)}`,
                  feelsRange: `${Math.round(fMin)}..${Math.round(fMax)}`,
                  windRange: `${Math.round(wMin)}..${Math.round(wMax)}`,
                  windGusts: Math.round(gMax),
                  windDirection: windDirStr,
                  windDirFull: windDirFullStr,
                  windDeg: windDeg,
                  sunSeconds: sunVal,
                  sunStr: formatSunTime(sunVal),
                  accuracy: "High",
                  clothingHints,
                  rideDuration: rideDuration,
                  startTemperature: startTemperature,
                  endTemperature: endTemperature,
                  temperature900hPa: Math.round(temp900hPaMin),
                  startTemperature900hPa: startTemperature900hPa,
                  endTemperature900hPa: endTemperature900hPa,
                  temperature850hPa: Math.round(temp850hPaMin),
                  startTemperature850hPa: startTemperature850hPa,
                  endTemperature850hPa: endTemperature850hPa
              };

              if (index === 0) result.weekend1.saturday = dayStats;
              if (index === 1) result.weekend1.sunday = dayStats;
              if (index === 2) result.weekend2.saturday = dayStats;
              if (index === 3) result.weekend2.sunday = dayStats;
          });


          await Promise.all(promises);
          return result;
      } catch (e) {
          console.error(`Failed to fetch for ${cityName}`, e);
          return null;
      }
  }

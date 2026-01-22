import { useMemo } from "react";
import { CityAnalysisResult } from "../types";
import { gpxFiles, CITY_FILENAMES } from "../constants";
import { getCardinal } from "../services/weatherService";

interface UseSummaryFilteringProps {
  data: CityAnalysisResult[];
  isSecondWeekend: boolean;
}

export const useSummaryFiltering = ({ data, isSecondWeekend }: UseSummaryFilteringProps) => {
  const weekendKey = isSecondWeekend ? "weekend2" : "weekend1";

  const getSunnyCities = (day: "saturday" | "sunday") => {
    return data
      .filter(city => {
        const dayData = city[weekendKey]?.[day];
        if (!dayData || !dayData.isRideable) return false;

        const windDirCode = getCardinal(dayData.windDeg);
        const fileCityName = CITY_FILENAMES[city.cityName] || city.cityName;
        const prefix = `${fileCityName}_${windDirCode}`;
        
        const hasRoute = gpxFiles.some(path => {
            const parts = path.split('/');
            const filename = parts[parts.length - 1].replace('.gpx', '');
            return filename === prefix || filename.startsWith(prefix + '_');
        });

        return hasRoute;
      })
      .sort((a, b) => {
        const sunA = a[weekendKey]?.[day]?.sunSeconds ?? 0;
        const sunB = b[weekendKey]?.[day]?.sunSeconds ?? 0;
        return sunB - sunA;
      });
  };

  const sunnyCities = useMemo(() => {
    const saturday = getSunnyCities("saturday");
    const sunday = getSunnyCities("sunday");

    // Process holidays
    const holidaysMap = new Map<string, { dateObj: Date, dayName: string, cities: CityAnalysisResult[] }>();
    
    data.forEach(city => {
        city.extraDays?.forEach(dayStat => {
            if (!dayStat.isRideable) return;

            const windDirCode = getCardinal(dayStat.windDeg);
            const fileCityName = CITY_FILENAMES[city.cityName] || city.cityName;
            const prefix = `${fileCityName}_${windDirCode}`;
            const hasRoute = gpxFiles.some(path => {
                const parts = path.split('/');
                const filename = parts[parts.length - 1].replace('.gpx', '');
                return filename === prefix || filename.startsWith(prefix + '_');
            });
             
            if (!hasRoute) return;

            const key = dayStat.dateStr;
            if (!holidaysMap.has(key)) {
                holidaysMap.set(key, { dateObj: dayStat.dateObj, dayName: dayStat.dayName, cities: [] });
            }
            holidaysMap.get(key)!.cities.push(city);
        });
    });

    holidaysMap.forEach((group, key) => {
        group.cities.sort((a, b) => {
             const dayA = a.extraDays.find(d => d.dateStr === key);
             const dayB = b.extraDays.find(d => d.dateStr === key);
             return (dayB?.sunSeconds ?? 0) - (dayA?.sunSeconds ?? 0);
        });
    });

    const allHolidays = Array.from(holidaysMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const w1Sat = data[0]?.weekend1.saturday?.dateObj;
    const w2Sat = data[0]?.weekend2.saturday?.dateObj;

    let relevantHolidays = allHolidays;
    if (w1Sat && w2Sat) {
        // Cutoff is mid-week between W1 and W2.
        const cutoff = w1Sat.getTime() + (w2Sat.getTime() - w1Sat.getTime()) / 2;
        
        if (!isSecondWeekend) {
             relevantHolidays = allHolidays.filter(h => h.dateObj.getTime() < cutoff);
        } else {
             relevantHolidays = allHolidays.filter(h => h.dateObj.getTime() >= cutoff);
        }
    }

    return { saturday, sunday, holidays: relevantHolidays };
  }, [data, isSecondWeekend]);

  return { sunnyCities };
};

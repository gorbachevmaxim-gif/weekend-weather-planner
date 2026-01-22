import { useMemo } from "react";
import { CityAnalysisResult } from "../types";
import { gpxFiles, CITY_FILENAMES } from "../constants";
import { getCardinal } from "../services/weatherService";

interface UseSummaryFilteringProps {
  data: CityAnalysisResult[];
  isSecondWeekend: boolean;
}

const unfavorableDirections: { [key: string]: string[] } = {
    "N": ["N", "NE", "NW"],
    "NE": ["N", "NE", "E"],
    "E": ["E", "NE", "SE"],
    "SE": ["S", "SE", "E"],
    "S": ["S", "SE", "SW"],
    "SW": ["S", "SW", "W"],
    "W": ["W", "SW", "NW"],
    "NW": ["N", "NW", "W"],
};


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
    return { saturday, sunday };
  }, [data, isSecondWeekend]);

  return { sunnyCities };
};

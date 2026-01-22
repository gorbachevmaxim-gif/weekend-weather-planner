import { useMemo } from "react";
import { CityAnalysisResult } from "../types";
import { gpxFiles, CITY_FILENAMES, MIN_SUN_HOURS } from "../constants";

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
    const minSunSeconds = MIN_SUN_HOURS * 3600;

    return data
      .filter(city => {
        const dayData = city[weekendKey]?.[day];
        return dayData?.isRideable && dayData.sunSeconds >= minSunSeconds;
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

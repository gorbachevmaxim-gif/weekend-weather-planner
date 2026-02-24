import React from "react";
import { RouteData } from "../../services/gpxUtils";

interface CityRouteStatsProps {
    routeData?: RouteData;
    speed: number;
    setSpeed: (val: number | ((prev: number) => number)) => void;
    isDesktop: boolean;
    isDark: boolean;
}

const CityRouteStats: React.FC<CityRouteStatsProps> = ({ routeData, speed, setSpeed, isDesktop, isDark }) => {
    if (!routeData) return null;

    const calculateDuration = (distKm: number, speedKmH: number) => {
        let hours = Math.floor(distKm / speedKmH);
        let minutes = Math.round((distKm / speedKmH - hours) * 60);

        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const renderWeatherValue = (value: string, unit: string) => (
        <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
            {value.replace("-", "–")}
            <span className="text-base font-unbounded font-medium" style={{ color: isDark ? "#D9D9D9" : "#111111" }}>{unit.replace("-", "–")}</span>
        </p>
    );

    return (
        <div className={`${isDesktop ? '' : 'px-4 pb-[14px]'} grid grid-cols-2 md:grid-cols-4 gap-4`}>
            <div className="flex flex-col">
                <p className="text-xs text-neutral-400">ДИСТАНЦИЯ</p>
                {renderWeatherValue(routeData.distanceKm.toFixed(0), " км")}
            </div>
            <div className="flex flex-col">
                <p className="text-xs text-neutral-400">НАБОР</p>
                {renderWeatherValue(Math.round(routeData.elevationM).toString(), " м")}
            </div>
            <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                    <p className="text-xs text-neutral-400">ТЕМП</p>
                    <div className="flex items-center gap-1.5 -mt-1">
                        <button 
                            onClick={() => setSpeed((s: number) => Math.max(23, s - 1))} 
                            className={`w-5 h-5 flex items-center justify-center text-lg leading-none pb-0.5 -translate-x-0.5 text-neutral-400 ${isDark ? "hover:text-[#D9D9D9] hover:bg-[#333333]" : "hover:text-black hover:bg-gray-200"} rounded transition-colors`}
                        >
                            −
                        </button>
                        <button 
                            onClick={() => setSpeed((s: number) => Math.min(38, s + 1))} 
                            className={`w-5 h-5 flex items-center justify-center text-lg leading-none pb-0.5 -translate-x-1 text-neutral-400 ${isDark ? "hover:text-[#D9D9D9] hover:bg-[#333333]" : "hover:text-black hover:bg-gray-200"} rounded transition-colors`}
                        >
                            +
                        </button>
                    </div>
                </div>
                {renderWeatherValue(speed.toString(), " км/ч")}
            </div>
            <div className="flex flex-col">
                <p className="text-xs text-neutral-400">В СЕДЛЕ</p>
                <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-[#111111]"}`}>
                    {calculateDuration(routeData.distanceKm, speed)}
                </p>
            </div>
        </div>
    );
};

export default CityRouteStats;

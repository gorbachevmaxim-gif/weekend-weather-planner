import React from "react";
import { RouteData } from "../services/gpxUtils";
import { CityAnalysisResult } from "../types";

interface RouteInfoProps {
    currentRouteData: RouteData;
    activeStats: CityAnalysisResult['weekend1']['saturday'];
    routeStartCity: string;
    routeEndCity: string;
}

const renderWeatherValue = (value: string, unit: string) => (
    <p className="text-base font-unbounded font-bold text-black">
        {value.replace("-", "–")}
        <span className="text-base font-unbounded font-bold" style={{ color: "#111111" }}>{unit.replace("-", "–")}</span>
    </p>
);

export const RouteInfo: React.FC<RouteInfoProps> = ({ currentRouteData, activeStats, routeStartCity, routeEndCity }) => {
    if (!currentRouteData) return null;

    return (
        <div>
            <div className="p-4 mt-0 border-t border-[#D9D9D9]">
                <h2 className="font-unbounded font-bold text-base">
                    Маршрут
                </h2>
                <p className="font-nunito text-[15px]">{routeStartCity}—{routeEndCity}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 pb-4 border-b border-neutral-200">
                <div className="flex flex-col">
                    <p className="font-sans text-xs text-neutral-400">ДИСТАНЦИЯ</p>
                    {renderWeatherValue(currentRouteData.distanceKm.toFixed(0), " км")}
                </div>
                <div className="flex flex-col">
                    <p className="font-sans text-xs text-neutral-400">НАБОР</p>
                    {renderWeatherValue(Math.round(currentRouteData.elevationM).toString(), " м")}
                </div>
                <div className="flex flex-col">
                    <p className="font-sans text-xs text-neutral-400">ТЕМП</p>
                    {renderWeatherValue("30", " км/ч")}
                </div>
                {activeStats?.rideDuration && (
                    <div className="flex flex-col">
                        <p className="font-sans text-xs text-neutral-400">В СЕДЛЕ</p>
                        <p className="text-base font-unbounded font-bold text-[#111111]">
                            {activeStats.rideDuration}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

import React from "react";
import { CityAnalysisResult } from "../types";
import ArrowUp from "./icons/ArrowUp";
import { MOUNTAIN_CITIES } from "../services/weatherService";

interface WeatherBlockProps {
    activeStats: CityAnalysisResult["weekend1"]["saturday"];
    cityName: string; // Add cityName prop
}

const renderWeatherValue = (value: string, unit: string) => (
    <p className="text-base font-unbounded font-bold text-black">
        {value.replace("-", "–")}
        <span className="text-base font-unbounded font-bold" style={{ color: "#1E1E1E" }}>{unit.replace("-", "–")}</span>
    </p>
);

const renderWeatherBlock = (title: string, value: string, unit: string, subValue: string) => (
    <div className="flex flex-col flex-1">
        <p className="font-sans text-xs text-neutral-400">{title}</p>
        {title === "ОСАДКИ" ? (
            <p className="text-base font-unbounded font-bold text-black">
                {value}
                <span className="text-base font-unbounded font-bold" style={{ color: "#1E1E1E" }}>{unit}</span>
            </p>
        ) : (
            renderWeatherValue(value, unit)
        )}
        <p className="text-xs text-neutral-400">{subValue.replace("-", "–")}</p>
    </div>
);

export const WeatherBlock: React.FC<WeatherBlockProps> = ({ activeStats, cityName }) => {
    if (!activeStats) return null;

    const isMountainCity = MOUNTAIN_CITIES.includes(cityName);
    const temperatureSubValue = isMountainCity && activeStats.temperature900hPa !== undefined && activeStats.temperature850hPa !== undefined
        ? `[1000 м ${activeStats.temperature900hPa}º, 1500 м ${activeStats.temperature850hPa}º]`
        : `Ощущ: ${activeStats.feelsRange.split("..",)[0]}°..${activeStats.feelsRange.split("..",)[1]}°`;

    return (
        <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderWeatherBlock("ТЕМПЕРАТУРА", activeStats.tempRange.split("..",)[0] + "°", `..${activeStats.tempRange.split("..",)[1]}°`, temperatureSubValue)}
                <div className="flex flex-col flex-1">
                    <p className="font-sans text-xs text-neutral-400">ВЕТЕР</p>
                    {renderWeatherValue(activeStats.windRange, " км/ч")}
                    <p className="text-xs text-neutral-400 flex items-center">
                        {activeStats.windDirection}
                        <ArrowUp width="14" height="14" style={{ transform: `rotate(${activeStats.windDeg + 180}deg)`, marginLeft: "4px", marginRight: "4px" }} />
                        Порывы {activeStats.windGusts}
                    </p>
                </div>
                {renderWeatherBlock("ОСАДКИ", activeStats.isDry ? "0" : activeStats.precipSum.toFixed(1), " мм", `Вероятность ${activeStats.precipitationProbability}%`)}
                {renderWeatherBlock("СОЛНЦЕ", activeStats.sunStr.split(" ")[0], ` ч ${activeStats.sunStr.split(" ")[2]} мин`, "09:00 – 18:00")}
            </div>
        </div>
    );
};

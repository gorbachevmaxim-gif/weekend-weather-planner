import React from "react";
import ArrowUp from "../icons/ArrowUp";
import { WeatherDayStats } from "../../types";
import { MOUNTAIN_CITIES } from "../../config/constants";

interface CityWeatherProps {
    stats: WeatherDayStats;
    cityName: string;
    isDesktop: boolean;
    isDark: boolean;
}

const CityWeather: React.FC<CityWeatherProps> = ({ stats, cityName, isDesktop, isDark }) => {
    const renderWeatherValue = (value: string, unit: string) => (
        <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
            {value.replace("-", "–")}
            <span className="text-base font-unbounded font-medium" style={{ color: isDark ? "#D9D9D9" : "#111111" }}>{unit.replace("-", "–")}</span>
        </p>
    );

    const renderWeatherBlock = (title: string, value: string, unit: string, subValue: string) => (
        <div className="flex flex-col">
            <p className="text-xs text-neutral-400">{title}</p>
            {title === "ОСАДКИ" ? (
                <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
                    {value}
                    <span className="text-base font-unbounded font-medium" style={{ color: isDark ? "#D9D9D9" : "#111111" }}>{unit}</span>
                </p>
            ) : (
                renderWeatherValue(value, unit)
            )}
            <p className="text-xs text-neutral-400">{subValue.replace("-", "-")}</p>
        </div>
    );

    const isMountainCity = MOUNTAIN_CITIES.includes(cityName);
    const temperatureSubValue = isMountainCity && stats.temperature900hPa !== undefined && stats.temperature850hPa !== undefined
        ? `1000 м ${stats.temperature900hPa}º, 1500 м ${stats.temperature850hPa}º`
        : `Ощущ: ${stats.feelsRange.split("..")[0]}°..${stats.feelsRange.split("..")[1]}°`;

    return (
        <div className={`${isDesktop ? `bg-transparent border-y py-6 ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"}` : 'px-4 py-[14px]'}`}>
            <div className={`grid gap-4 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
                {renderWeatherBlock("ТЕМПЕРАТУРА", stats.tempRange.split("..")[0] + "°", `..${stats.tempRange.split("..")[1]}°`, temperatureSubValue)}
                <div className="flex flex-col">
                    <p className="text-xs text-neutral-400">ВЕТЕР</p>
                    {renderWeatherValue(stats.windRange, " км/ч")}
                    <p className="text-xs text-neutral-400 flex items-center">
                        {stats.windDirection}
                        <ArrowUp width="14" height="14" style={{ transform: `rotate(${stats.windDeg + 180}deg)`, marginLeft: '4px', marginRight: '4px' }} />
                        Порывы {String(stats.windGusts)}
                    </p>
                </div>
                {renderWeatherBlock("ОСАДКИ", stats.isDry ? "0" : stats.precipSum.toFixed(1), " мм", (stats.isRideable && stats.rainHours) ? stats.rainHours : `Вероятность ${stats.precipitationProbability}%`)}
                {renderWeatherBlock("СОЛНЦЕ", stats.sunStr.split(" ")[0], ` ч ${stats.sunStr.split(" ")[2]} мин`, "09:00 – 18:00")}
            </div>
        </div>
    );
};

export default CityWeather;

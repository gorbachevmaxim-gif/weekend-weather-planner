import React, { useState, useEffect } from "react";
import { CityAnalysisResult } from "../types";
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from "../constants";
import { getCardinal, MOUNTAIN_CITIES } from "../services/weatherService";
import { parseGpx, getDistanceFromLatLonInKm, RouteData } from "../services/gpxUtils";
import RoutesIcon from "./icons/RoutesIcon";
import ArrowDown from "./icons/ArrowDown";
import ArrowLeftDiagonal from "./icons/ArrowLeftDiagonal";
import ArrowUp from "./icons/ArrowUp";
import MinusIcon from "./icons/MinusIcon";
import PlusIcon from "./icons/PlusIcon";
import { CITY_TRANSPORT_CONFIG } from "../transportConfig";
import { MapView } from "./MapView";

interface CityDetailProps {
    data: CityAnalysisResult;
    initialTab?: "w1" | "w2";
    initialDay?: string;
    onClose: () => void;
}

interface FoundRoute {
    routeData: RouteData;
    gpxString: string;
}

const getShortDayName = (fullName: string) => {
    const map: { [key: string]: string } = {
        "Понедельник": "ПН",
        "Вторник": "ВТ",
        "Среда": "СР",
        "Четверг": "ЧТ",
        "Пятница": "ПТ",
        "Суббота": "СБ",
        "Воскресенье": "ВС"
    };
    return map[fullName] || fullName.slice(0, 2).toUpperCase();
};

const CityDetail: React.FC<CityDetailProps> = ({ data, initialTab = "w1", initialDay, onClose }) => {
    const [canShare, setCanShare] = useState(false);
    const [activeTab, setActiveTab] = useState<"w1" | "w2">(initialTab);
    const [routeDay, setRouteDay] = useState<string | null>(null);
    const [routeStatus, setRouteStatus] = useState<string>("");
    const [foundRoutes, setFoundRoutes] = useState<FoundRoute[]>([]);
    const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [speed, setSpeed] = useState<number>(30);

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const activeWeekend = activeTab === "w1" ? data.weekend1 : data.weekend2;

    useEffect(() => {
        if ("share" in navigator && "canShare" in navigator) {
            const testFile = new File([], "test.gpx", { type: "application/gpx+xml" });
            if (navigator.canShare({ files: [testFile] })) {
                setCanShare(true);
            }
        }
    }, []);

    useEffect(() => {
        if (initialDay) {
            setRouteDay(initialDay);
        }
        else if (activeWeekend.saturday?.isDry) {
            setRouteDay("saturday");
        }
        else if (activeWeekend.sunday?.isDry) {
            setRouteDay("sunday");
        }
    }, [activeTab, activeWeekend, initialDay]);

    let activeStats = null;
    if (routeDay === "saturday") activeStats = activeWeekend.saturday;
    else if (routeDay === "sunday") activeStats = activeWeekend.sunday;
    else {
        activeStats = data.extraDays?.find(d => d.dateStr === routeDay) || null;
    }

    // Fallback if activeStats is null (e.g. switched tab and routeDay was saturday but saturday is null?)
    // But routeDay is state.
    
    const cityCoords = CITIES[data.cityName];
    const currentRouteData = foundRoutes[selectedRouteIdx]?.routeData;
    const isFlightDestination = FLIGHT_CITIES.includes(data.cityName);

    const moscow = CITIES["Москва"];

    let routeStartLat = cityCoords.lat, routeStartLon = cityCoords.lon;
    let routeEndLat = cityCoords.lat, routeEndLon = cityCoords.lon;

    if (currentRouteData && currentRouteData.points.length > 0) {
        routeStartLat = currentRouteData.points[0][0];
        routeStartLon = currentRouteData.points[0][1];
        const lastIdx = currentRouteData.points.length - 1;
        routeEndLat = currentRouteData.points[lastIdx][0];
        routeEndLon = currentRouteData.points[lastIdx][1];
    }

    const findClosestCityName = (lat: number, lon: number) => {
        let closestName = data.cityName;
        let minD = Infinity;
        for (const [name, coords] of Object.entries(CITIES)) {
            const d = getDistanceFromLatLonInKm(lat, lon, coords.lat, coords.lon);
            if (d < minD) { minD = d; closestName = name; }
        }
        return closestName;
    };

    const routeStartCity = findClosestCityName(routeStartLat, routeStartLon);
    const routeEndCity = findClosestCityName(routeEndLat, routeEndLon);

    const getStationName = (city: string) => {
        return CITY_TRANSPORT_CONFIG[city]?.displayName || city;
    };

    const getMoscowStationName = (city: string) => {
        return CITY_TRANSPORT_CONFIG[city]?.moscowStation || "Москва";
    };

    const startStation = getStationName(routeStartCity);
    const endStation = getStationName(routeEndCity);
    const startMoscowStation = getMoscowStationName(routeStartCity);
    const endMoscowStation = getMoscowStationName(routeEndCity);

    useEffect(() => {
        let isMounted = true;
        if (!activeStats || !cityCoords) return;
        if (isFlightDestination) {
            setRouteStatus("Авианаправление");
            setFoundRoutes([]);
            return;
        }
        const windDirCode = getCardinal(activeStats.windDeg);
        setRouteStatus("Поиск...");
        setFoundRoutes([]);
        setSelectedRouteIdx(0);
        const fileCityName = CITY_FILENAMES[data.cityName] || data.cityName;
        const baseName = `routes/${fileCityName}_${windDirCode}`;
        const candidates = [`${baseName}.gpx`, `${baseName}_1.gpx`, `${baseName}_2.gpx`, `${baseName}_3.gpx`];

        Promise.all(candidates.map(url =>
            fetch(`${url}?t=${Date.now()}`).then(r => r.ok ? r.text() : Promise.resolve(null))
        ))
            .then(gpxStrings => {
                if (!isMounted) return;
                const validRoutes: FoundRoute[] = gpxStrings
                    .map(gpxString => {
                        if (!gpxString) return null;
                        const routeData = parseGpx(gpxString);
                        if (!routeData) return null;
                        return { routeData, gpxString };
                    })
                    .filter((r): r is FoundRoute => r !== null);

                if (validRoutes.length > 0) {
                    setFoundRoutes(validRoutes);
                    setRouteStatus(`Найдено маршрутов: ${validRoutes.length}`);
                }
                else {
                    setFoundRoutes([]);
                    setRouteStatus("Нет маршрута под такое направление ветра");
                }
            });
        return () => { isMounted = false; };
    }, [activeStats, cityCoords, data.cityName, isFlightDestination]);

    const handleDownloadGpx = () => {
        const selectedRoute = foundRoutes[selectedRouteIdx];
        if (!selectedRoute || !activeStats) return;

        const fileCityName = CITY_FILENAMES[data.cityName] || data.cityName;
        const windDirCode = getCardinal(activeStats.windDeg);
        const filename = `${fileCityName}_${windDirCode}${foundRoutes.length > 1 ? `_${selectedRouteIdx + 1}` : ""}.gpx`;

        const blob = new Blob([selectedRoute.gpxString], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShareGpx = async () => {
        const selectedRoute = foundRoutes[selectedRouteIdx];
        if (!selectedRoute || !activeStats) return;

        const fileCityName = CITY_FILENAMES[data.cityName] || data.cityName;
        const windDirCode = getCardinal(activeStats.windDeg);
        const filename = `${fileCityName}_${windDirCode}${foundRoutes.length > 1 ? `_${selectedRouteIdx + 1}` : ""}.gpx`;

        const blob = new Blob([selectedRoute.gpxString], { type: "application/gpx+xml" });
        const file = new File([blob], filename, { type: "application/gpx+xml" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: "GPX Route",
                    text: `GPX route for ${data.cityName}`,
                });
            }
            catch (error) {
                console.error("Error sharing", error);
            }
        }
    };

    const generateTransportLink = (fromCityName: string, toCityName: string, date: Date) => {
        const fromConfig = CITY_TRANSPORT_CONFIG[fromCityName];
        const toConfig = CITY_TRANSPORT_CONFIG[toCityName];

        if (!fromConfig || !toConfig) {
            return "#";
        }

        const isFlight = fromConfig.provider === "aeroflot" || toConfig.provider === "aeroflot";

        if (isFlight) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            
            const fromCode = fromConfig.apiName === "Москва" ? "MOW" : fromConfig.apiName;
            const toCode = toConfig.apiName === "Москва" ? "MOW" : toConfig.apiName;

            return `https://www.aviasales.ru/search/${fromCode}${day}${month}${toCode}1`;
        }

        if (!fromConfig.yandexId || !toConfig.yandexId) {
            console.error("Missing transport config for Yandex link generation", { fromCityName, toCityName, fromConfig, toConfig });
            return "#";
        }

        const fromId = fromConfig.yandexId;
        const fromName = encodeURIComponent(fromConfig.displayName);
        const toId = toConfig.yandexId;
        const toName = encodeURIComponent(toConfig.displayName);

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
        const year = date.getFullYear();
        const when = encodeURIComponent(`${day}.${month}.${year}`);

        return `https://rasp.yandex.ru/search/suburban/?fromId=${fromId}&fromName=${fromName}&toId=${toId}&toName=${toName}&when=${when}`;
    };

    const renderWeatherValue = (value: string, unit: string) => (
        <p className="text-base font-unbounded font-bold text-black">
            {value.replace("-", "–")}
            <span className="text-base font-unbounded font-bold" style={{ color: "#1E1E1E" }}>{unit.replace("-", "–")}</span>
        </p>
    );

    const renderWeatherBlock = (title: string, value: string, unit: string, subValue: string) => (
        <div className="flex flex-col flex-1">
            <p className="text-xs text-neutral-400">{title}</p>
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

    const isMountainCity = MOUNTAIN_CITIES.includes(data.cityName);
    const temperatureSubValue = isMountainCity && activeStats?.temperature900hPa !== undefined && activeStats?.temperature850hPa !== undefined
        ? `1000 м ${activeStats.temperature900hPa}º, 1500 м ${activeStats.temperature850hPa}º`
        : `Ощущ: ${activeStats?.feelsRange.split("..",)[0]}°..${activeStats?.feelsRange.split("..",)[1]}°`;

    // Prepare markers
    const markers: { coords: [number, number]; label: string }[] = [];

    const calculateDuration = (distKm: number, speedKmH: number) => {
        let hours = Math.floor(distKm / speedKmH);
        let minutes = Math.round((distKm / speedKmH - hours) * 60);

        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    return (
        <div className="mx-auto text-black flex-grow flex flex-col" style={{ backgroundColor: "#F5F5F5" }}>
            <div className="sticky top-0 bg-[#F5F5F5] z-10">
                <div className="flex">
                    <button
                        className={`flex-1 text-center py-2 text-lg font-sans font-semibold tracking-tighter ${activeTab === "w1" ? "text-black border-b-2 border-black" : "text-[#B2B2B2] border-b-2 border-[#B2B2B2]"}`}
                        onClick={() => setActiveTab("w1")}
                    >
                        Эти выходные
                    </button>
                    <button
                        className={`flex-1 text-center py-2 text-lg font-sans font-semibold tracking-tighter ${activeTab === "w2" ? "text-black border-b-2 border-black" : "text-[#B2B2B2] border-b-2 border-[#B2B2B2]"}`}
                        onClick={() => setActiveTab("w2")}
                    >
                        Через неделю
                    </button>
                </div>
                <div className="flex items-center px-4 mt-4 pb-4 border-b border-[#D9D9D9] overflow-x-auto whitespace-nowrap gap-0">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full flex items-center justify-center bg-[#000DFF] hover:bg-[#000BD5] shrink-0"
                        style={{ width: "54px", height: "38px" }}
                    >
                        <ArrowLeftDiagonal />
                    </button>
                    {(() => {
                        const daysList = [];
                        if (activeWeekend.saturday) {
                            daysList.push({ id: "saturday", label: "СБ", date: activeWeekend.saturday.dateObj });
                        }
                        if (activeWeekend.sunday) {
                            daysList.push({ id: "sunday", label: "ВС", date: activeWeekend.sunday.dateObj });
                        }
                        
                        const w1Sat = data.weekend1.saturday?.dateObj;
                        const w2Sat = data.weekend2.saturday?.dateObj;
                        
                        if (data.extraDays) {
                            if (w1Sat && w2Sat) {
                                const cutoff = w1Sat.getTime() + (w2Sat.getTime() - w1Sat.getTime()) / 2;
                                data.extraDays.forEach(day => {
                                    const isW1 = day.dateObj.getTime() < cutoff;
                                    const isTabW1 = activeTab === "w1";
                                    if (isW1 === isTabW1) {
                                        daysList.push({ 
                                            id: day.dateStr, 
                                            label: getShortDayName(day.dayName), 
                                            date: day.dateObj 
                                        });
                                    }
                                });
                            } else {
                                data.extraDays.forEach(day => {
                                    daysList.push({ 
                                        id: day.dateStr, 
                                        label: getShortDayName(day.dayName), 
                                        date: day.dateObj 
                                    });
                                });
                            }
                        }
                        
                        daysList.sort((a, b) => a.date.getTime() - b.date.getTime());

                        return daysList.map(dayItem => (
                            <button
                                key={dayItem.id}
                                className={`text-[13px] py-2 px-4 rounded-full shrink-0 ${routeDay === dayItem.id ? "text-white bg-[#333333]" : "text-black bg-[#DDDDDD] hover:bg-[#D5D5D5]"}`}
                                style={{ width: dayItem.id === "saturday" || dayItem.id === "sunday" ? "54px" : "auto", minWidth: "54px", height: "38px" }}
                                onClick={() => setRouteDay(dayItem.id)}
                            >
                                {dayItem.label}
                            </button>
                        ));
                    })()}
                    <div className="text-[13px] py-2 px-4 rounded-full text-black shrink-0" style={{ backgroundColor: "#FFFFFF" }}>
                        {data.cityName}
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto flex-1">
                {activeStats && (
                    <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {renderWeatherBlock("ТЕМПЕРАТУРА", activeStats.tempRange.split("..",)[0] + "°", `..${activeStats.tempRange.split("..",)[1]}°`, temperatureSubValue)}
                            <div className="flex flex-col flex-1">
                                <p className="text-xs text-neutral-400">ВЕТЕР</p>
                                {renderWeatherValue(activeStats.windRange, " км/ч")}
                                <p className="text-xs text-neutral-400 flex items-center">
                                    {activeStats.windDirection}
                                    <ArrowUp width="14" height="14" style={{ transform: `rotate(${activeStats.windDeg + 180}deg)`, marginLeft: '4px', marginRight: '4px' }} />
                                    Порывы {activeStats.windGusts}
                                </p>
                            </div>
                            {renderWeatherBlock("ОСАДКИ", activeStats.isDry ? "0" : activeStats.precipSum.toFixed(1), " мм", (activeStats.isRideable && activeStats.rainHours) ? activeStats.rainHours : `Вероятность ${activeStats.precipitationProbability}%`)}
                            {renderWeatherBlock("СОЛНЦЕ", activeStats.sunStr.split(" ")[0], ` ч ${activeStats.sunStr.split(" ")[2]} мин`, "09:00 – 18:00")}
                        </div>
                    </div>
                )}
                {activeStats && (
                <div className="p-4 mt-0 border-t border-[#D9D9D9]">
                    <h2 className="font-unbounded font-bold text-base">
                        Маршрут на {activeStats?.dateObj.toLocaleDateString("ru-RU", { weekday: "short" })}, {activeStats?.dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                    </h2>
                    <p className="text-[15px] text-[#666666]">{routeStartCity}—{routeEndCity}</p>
                </div>
                )}
                {currentRouteData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 pb-4 border-b border-neutral-200">
                        <div className="flex flex-col">
                            <p className="text-xs text-neutral-400">ДИСТАНЦИЯ</p>
                            {renderWeatherValue(currentRouteData.distanceKm.toFixed(0), " км")}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-xs text-neutral-400">НАБОР</p>
                            {renderWeatherValue(Math.round(currentRouteData.elevationM).toString(), " м")}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-neutral-400">ТЕМП</p>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => setSpeed(s => Math.max(23, s - 1))} 
                                        className="text-neutral-400 hover:text-black hover:bg-gray-200 rounded transition-colors"
                                    >
                                        <MinusIcon width="12" height="12" />
                                    </button>
                                    <button 
                                        onClick={() => setSpeed(s => Math.min(38, s + 1))} 
                                        className="text-neutral-400 hover:text-black hover:bg-gray-200 rounded transition-colors"
                                    >
                                        <PlusIcon width="12" height="12" />
                                    </button>
                                </div>
                            </div>
                            {renderWeatherValue(speed.toString(), " км/ч")}
                        </div>
                        <div className="flex flex-col">
                            <p className="text-xs text-neutral-400">В СЕДЛЕ</p>
                            <p className="text-base font-unbounded font-bold text-[#1E1E1E]">
                                {calculateDuration(currentRouteData.distanceKm, speed)}
                            </p>
                        </div>
                    </div>
                )}

                <MapView 
                    cityCoords={cityCoords}
                    currentRouteData={currentRouteData}
                    routeStatus={routeStatus}
                    markers={markers}
                    windDeg={activeStats?.windDeg}
                    windSpeed={activeStats?.windRange}
                    windDirection={activeStats?.windDirection}
                />

                <div className="flex flex-col sm:flex-row p-4 space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                        onClick={handleDownloadGpx}
                        className="flex-1 py-3 px-4 bg-white text-black rounded-full font-bold flex justify-center hover:bg-[#E1E1E2]"
                    >
                        <span>Скачать GPX</span>
                    </button>
                    {canShare && (
                        <button
                            onClick={handleShareGpx}
                            className="flex-1 py-3 px-4 bg-white text-black rounded-full font-bold flex justify-center hover:bg-[#E1E1E2]"
                        >
                            <span>Открыть GPX</span>
                        </button>
                    )}
                </div>
                <div className="mt-6 space-y-2 p-4 mb-12">
                    {routeStartCity !== "Москва" && (
                        <a
                            href={activeStats?.dateObj ? generateTransportLink("Москва", routeStartCity, activeStats.dateObj) : "#"}
                            className={`flex items-center text-xl font-unbounded font-bold text-left py-px ${openSection !== null ? 'text-[#B2B2B2]' : 'text-[#1E1E1E]'} hover:text-[#777777]`}
                            target="_blank"
                        >
                            <div className="flex flex-col">
                                <span className="flex items-center">Туда<RoutesIcon width="22" height="22" /></span>
                                <span className="text-sm text-[#666666] station-name">{startMoscowStation} – {startStation}</span>
                            </div>
                        </a>
                    )}
                    {routeEndCity !== "Москва" && (
                        <a
                            href={activeStats?.dateObj ? generateTransportLink(routeEndCity, "Москва", activeStats.dateObj) : "#"}
                            className={`flex items-center text-xl font-unbounded font-bold text-left py-px ${openSection !== null ? 'text-[#B2B2B2]' : 'text-[#1E1E1E]'} hover:text-[#777777]`}
                            target="_blank"
                        >
                            <div className="flex flex-col">
                                <span className="flex items-center">Обратно<RoutesIcon width="22" height="22" /></span>
                                <span className="text-sm text-[#666666] station-name">{endStation} – {endMoscowStation}</span>
                            </div>
                        </a>
                    )}
                    <a
                        href={`https://yandex.ru/maps/?ll=${cityCoords.lon},${cityCoords.lat}&z=12`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center text-xl font-unbounded font-bold text-left py-px ${openSection !== null ? 'text-[#B2B2B2]' : 'text-[#1E1E1E]'} hover:text-[#777777]`}
                    >
                        <span className="flex items-center">Вкусные места<RoutesIcon width="22" height="22" /></span>
                    </a>
                    <button
                        className={`text-xl font-unbounded font-bold text-left py-px ${openSection === "одежда" || openSection === null ? "text-[#1E1E1E]" : "text-[#B2B2B2]"} hover:text-[#777777]`}
                        onClick={() => toggleSection("одежда")}
                    >
                        <span className="flex items-center">Что надеть<ArrowDown isOpen={openSection === "одежда"} width="23" height="23" style={{ top: "-7px" }} /></span>
                    </button>
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden`}
                        style={{ maxHeight: openSection === "одежда" ? "200px" : "0" }}
                    >
                        {activeStats?.clothingHints && activeStats.clothingHints.length > 0 ? (
                            <div className="mt-0 flex flex-wrap pl-0">
                                {activeStats.clothingHints.map((hint: string) => (
                                    <span
                                        key={hint}
                                        className="bg-white text-black text-15 tracking-tighter rounded-full px-4 py-2"
                                    >
                                        {hint}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-0 pl-0 text-[#666666]">
                                Подскажем, что надеть на райд, когда погода наладится: нужно, чтобы было без осадков и теплее +5º.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <footer className="shrink-0 text-center text-xs text-neutral-400 p-4 border-t border-[#D9D9D9] bg-[#F5F5F5]">
                <a href="https://open-meteo.com/">
                    Weather data by Open-Meteo.com
                </a>
            </footer>
        </div>
    );
};

export default CityDetail;

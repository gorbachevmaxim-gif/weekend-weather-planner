import React, { useState, useEffect, useMemo, useRef } from "react";
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

const getShortMonthName = (date: Date) => {
    const months = [
        "янв", "фев", "мар", "апр", "май", "июн",
        "июл", "авг", "сен", "окт", "ноя", "дек"
    ];
    return months[date.getMonth()];
};

const CityDetail: React.FC<CityDetailProps> = ({ data, initialTab = "w1", initialDay, onClose }) => {
    const activeDayRef = useRef<HTMLButtonElement | null>(null);
    const [canShare, setCanShare] = useState(false);
    const [routeDay, setRouteDay] = useState<string | null>(null);
    const [routeStatus, setRouteStatus] = useState<string>("");
    const [foundRoutes, setFoundRoutes] = useState<FoundRoute[]>([]);
    const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [speed, setSpeed] = useState<number>(30);

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const allAvailableDays = useMemo(() => {
        const days: any[] = [];
        const w1Sat = data.weekend1.saturday;
        const w1Sun = data.weekend1.sunday;
        const w2Sat = data.weekend2.saturday;
        const w2Sun = data.weekend2.sunday;

        if (w1Sat) days.push({ id: "saturday", weekend: "w1", date: w1Sat.dateObj, label: w1Sat.dayName, stats: w1Sat });
        if (w1Sun) days.push({ id: "sunday", weekend: "w1", date: w1Sun.dateObj, label: w1Sun.dayName, stats: w1Sun });
        if (w2Sat) days.push({ id: "saturday", weekend: "w2", date: w2Sat.dateObj, label: w2Sat.dayName, stats: w2Sat });
        if (w2Sun) days.push({ id: "sunday", weekend: "w2", date: w2Sun.dateObj, label: w2Sun.dayName, stats: w2Sun });
        
        if (data.extraDays) {
            data.extraDays.forEach(day => {
                days.push({ id: day.dateStr, date: day.dateObj, label: day.dayName, stats: day });
            });
        }
        return days.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data]);

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
            // Find specific date string to be unambiguous
            const initialDate = allAvailableDays.find(d => d.id === initialDay && (!initialTab || d.weekend === initialTab))?.date.getTime();
            if (initialDate) {
                setRouteDay(initialDate.toString());
            } else {
                setRouteDay(initialDay);
            }
        } else {
            const firstRideable = allAvailableDays.find(d => d.stats?.isRideable && d.stats?.hasRoute);
            if (firstRideable) {
                setRouteDay(firstRideable.date.getTime().toString());
            } else if (allAvailableDays.length > 0) {
                setRouteDay(allAvailableDays[0].date.getTime().toString());
            }
        }
    }, [initialDay, initialTab, allAvailableDays]);

    const activeStats = useMemo(() => {
        return allAvailableDays.find(d => d.date.getTime().toString() === routeDay)?.stats || null;
    }, [routeDay, allAvailableDays]);

    useEffect(() => {
        if (activeDayRef.current) {
            activeDayRef.current.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest"
            });
        }
    }, [routeDay]);

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
        if (!activeStats || !cityCoords) {
            setFoundRoutes([]);
            setRouteStatus("");
            return;
        }
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

    const handleForwardGpx = async () => {
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
                    files: [file]
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
        <p className="text-base font-unbounded font-medium text-black">
            {value.replace("-", "–")}
            <span className="text-base font-unbounded font-medium" style={{ color: "#1E1E1E" }}>{unit.replace("-", "–")}</span>
        </p>
    );

    const renderWeatherBlock = (title: string, value: string, unit: string, subValue: string) => (
        <div className="flex flex-col flex-1">
            <p className="text-xs text-neutral-400">{title}</p>
            {title === "ОСАДКИ" ? (
                <p className="text-base font-unbounded font-medium text-black">
                    {value}
                    <span className="text-base font-unbounded font-medium" style={{ color: "#1E1E1E" }}>{unit}</span>
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
        <div className="mx-auto text-black flex-grow flex flex-col w-full" style={{ backgroundColor: "#F5F5F5" }}>
            <div className="sticky top-0 bg-[#F5F5F5] z-10 pt-4 pb-4 border-b border-[#D9D9D9]">
                <div className="flex items-center px-4 overflow-x-auto no-scrollbar whitespace-nowrap gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full flex items-center justify-center bg-[#222222] hover:bg-[#333333] shrink-0"
                        style={{ width: "54px", height: "38px" }}
                    >
                        <ArrowLeftDiagonal />
                    </button>
                    {allAvailableDays.map((dayItem: any) => {
                        const isSelected = dayItem.date.getTime().toString() === routeDay;
                        const dateFormatted = `${dayItem.date.getDate()} ${getShortMonthName(dayItem.date)}`;
                        
                        return (
                            <button
                                key={`${dayItem.weekend || ''}-${dayItem.id}-${dayItem.date.getTime()}`}
                                ref={isSelected ? activeDayRef : null}
                                className={`text-[30px] font-unbounded font-medium shrink-0 transition-colors ${isSelected ? "text-[#111111]" : "text-[#B2B2B2] hover:text-[#777777]"}`}
                                onClick={() => {
                                    setRouteDay(dayItem.date.getTime().toString());
                                }}
                            >
                                {dayItem.label} ({dateFormatted})
                            </button>
                        );
                    })}
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
                    <h2 className="font-unbounded font-medium text-base">
                        Маршрут на {activeStats?.dateObj.toLocaleDateString("ru-RU", { weekday: "short" })}, {activeStats?.dateObj.getDate()} {getShortMonthName(activeStats.dateObj)}
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
                            <p className="text-base font-unbounded font-medium text-[#1E1E1E]">
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

                <div className={`grid gap-4 px-4 pt-4 pb-2 ${canShare ? 'grid-cols-3 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); handleDownloadGpx(); }}
                        className="text-sm text-[#222222] hover:text-[#777777] flex items-baseline gap-0.5"
                    >
                        <span className="underline decoration-1 underline-offset-4">Скачать</span>
                        <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(135deg)", position: "relative", top: "7px", left: "-2px" }} />
                    </a>
                    {canShare && (
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleForwardGpx(); }}
                            className="text-sm text-[#222222] hover:text-[#777777] flex items-baseline gap-0.5"
                        >
                            <span className="underline decoration-1 underline-offset-4">Переслать</span>
                            <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(45deg)", position: "relative", top: "7px", left: "-2px" }} />
                        </a>
                    )}
                </div>
                <div className={`mt-6 px-4 pb-4 pt-6 mb-12 grid grid-cols-1 ${routeStartCity === "Москва" || routeEndCity === "Москва" ? "" : "md:grid-cols-2"} gap-4 border-t border-[#D9D9D9]`}>
                    {routeStartCity !== "Москва" && (
                        <a
                            href={activeStats?.dateObj ? generateTransportLink("Москва", routeStartCity, activeStats.dateObj) : "#"}
                            className={`flex items-center md:items-start text-xl font-unbounded font-medium text-left py-px ${openSection !== null ? 'text-[#B2B2B2]' : 'text-[#1E1E1E]'} hover:text-[#777777]`}
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
                            className={`flex items-center md:items-start text-xl font-unbounded font-medium text-left py-px ${openSection !== null ? 'text-[#B2B2B2]' : 'text-[#1E1E1E]'} hover:text-[#777777]`}
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
                        className={`self-start flex items-center text-xl font-unbounded font-medium text-left py-px ${openSection !== null ? 'text-[#B2B2B2]' : 'text-[#1E1E1E]'} hover:text-[#777777]`}
                    >
                        <div className="flex flex-col">
                            <span className="flex items-center">Вкусные места<RoutesIcon width="22" height="22" /></span>
                            <span className="text-sm text-[#666666] station-name">{data.cityName}</span>
                        </div>
                    </a>
                    <div className="flex flex-col">
                        <button
                            className={`text-xl font-unbounded font-medium text-left py-px ${openSection === "одежда" || openSection === null ? "text-[#1E1E1E]" : "text-[#B2B2B2]"} ${openSection === "одежда" ? "md:hover:text-[#777777]" : "hover:text-[#777777]"}`}
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
                                <div className="mt-0 pl-0 text-[#222222] text-sm">
                                    Подскажем, что надеть на райд, когда погода наладится: нужно, чтобы было без осадков и теплее +5º
                                </div>
                            )}
                        </div>
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

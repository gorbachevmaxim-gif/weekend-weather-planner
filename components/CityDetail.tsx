import React, { useState, useEffect, useMemo, useRef } from "react";
import { CityAnalysisResult } from "../types";
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from "../constants";
import { getCardinal, MOUNTAIN_CITIES } from "../services/weatherService";
import { parseGpx, getDistanceFromLatLonInKm, RouteData } from "../services/gpxUtils";
import { ElevationPoint, calculateProfileScore, getDifficultyLabel } from "../utils/elevationUtils";
import RoutesIcon from "./icons/RoutesIcon";
import ArrowDown from "./icons/ArrowDown";
import ArrowLeftDiagonal from "./icons/ArrowLeftDiagonal";
import ArrowUp from "./icons/ArrowUp";
import GpxIcon from "./icons/GpxIcon";
import ShareIcon from "./icons/ShareIcon";
import { CITY_TRANSPORT_CONFIG } from "../transportConfig";
import { MapView } from "./MapView";
import ElevationProfile from "./ElevationProfile";
import BottomSlider from "./BottomSlider";

// Helper component for smooth accordion animation
const AccordionContent: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => {
  const [overflow, setOverflow] = useState("overflow-hidden");

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setOverflow("overflow-visible"), 300);
      return () => clearTimeout(timer);
    } else {
      setOverflow("overflow-hidden");
    }
  }, [isOpen]);

  return (
    <div 
        className="grid transition-all duration-300 ease-in-out" 
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
    >
      <div className={overflow}>
        {children}
      </div>
    </div>
  );
};

interface CityDetailProps {
    data: CityAnalysisResult;
    initialTab?: "w1" | "w2";
    initialDay?: string;
    onClose: () => void;
    isDesktop?: boolean;
    onToggleSlider?: () => void;
    isDark?: boolean;
}

interface FoundRoute {
    routeData: RouteData;
    gpxString: string;
    url: string;
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
    return months[date.getMonth()].toUpperCase();
};

const CityDetail: React.FC<CityDetailProps> = ({ data, initialTab = "w1", initialDay, onClose, isDesktop = false, onToggleSlider, isDark = false }) => {
    const activeDayRef = useRef<HTMLButtonElement | null>(null);
    const [canShare, setCanShare] = useState(false);
    const [routeDay, setRouteDay] = useState<string | null>(null);
    const [routeStatus, setRouteStatus] = useState<string>("");
    const [foundRoutes, setFoundRoutes] = useState<FoundRoute[]>([]);
    const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(isDesktop ? { "одежда": true, "детали": true, "еда": true } : {});
    const [isMapFullscreen, setIsMapFullscreen] = useState(false);
    const [speed, setSpeed] = useState<number>(30);
    const [elevationHoverPoint, setElevationHoverPoint] = useState<ElevationPoint | null>(null);
    const [showProfileTooltip, setShowProfileTooltip] = useState(false);
    const [showDifficultyTooltip, setShowDifficultyTooltip] = useState(false);
    const [showDistanceTooltip, setShowDistanceTooltip] = useState(false);
    const [showPaceTooltip, setShowPaceTooltip] = useState(false);
    const [activeSliderContent, setActiveSliderContent] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return days
            .filter(d => {
                const dayDate = new Date(d.date);
                dayDate.setHours(0, 0, 0, 0);
                return d.stats.isRideable && dayDate.getTime() >= today.getTime();
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
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
            } else if (allAvailableDays.length > 0) {
                setRouteDay(allAvailableDays[0].date.getTime().toString());
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (document.fullscreenElement) return;
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);
    
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
            fetch(`${url}?t=${Date.now()}`).then(r => r.ok ? r.text().then(text => ({ text, url })) : Promise.resolve(null))
        ))
            .then(results => {
                if (!isMounted) return;
                const validRoutes: FoundRoute[] = results
                    .map(result => {
                        if (!result) return null;
                        const routeData = parseGpx(result.text);
                        if (!routeData) return null;
                        return { routeData, gpxString: result.text, url: result.url };
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

    const handleKomoot = () => {
        const selectedRoute = foundRoutes[selectedRouteIdx];
        if (!selectedRoute) return;

        const gpxUrl = new URL(selectedRoute.url, window.location.href).href;
        const komootUrl = `komoot://import?url=${encodeURIComponent(gpxUrl)}`;
        window.location.href = komootUrl;
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
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const when = encodeURIComponent(`${day}.${month}.${year}`);

        return `https://rasp.yandex.ru/search/suburban/?fromId=${fromId}&fromName=${fromName}&toId=${toId}&toName=${toName}&when=${when}`;
    };

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
            <p className="text-xs text-neutral-400">{subValue.replace("-", "–")}</p>
        </div>
    );

    const isMountainCity = MOUNTAIN_CITIES.includes(data.cityName);
    const temperatureSubValue = isMountainCity && activeStats?.temperature900hPa !== undefined && activeStats?.temperature850hPa !== undefined
        ? `1000 м ${activeStats.temperature900hPa}º, 1500 м ${activeStats.temperature850hPa}º`
        : `Ощущ: ${activeStats?.feelsRange.split("..",)[0]}°..${activeStats?.feelsRange.split("..",)[1]}°`;

    const profileScore = useMemo(() => {
        if (!currentRouteData) return 0;
        return calculateProfileScore(currentRouteData.points, currentRouteData.cumulativeDistances);
    }, [currentRouteData]);

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

    // Sub-render methods
    const renderWeatherSection = () => (
        activeStats && (
            <div className={`${isDesktop ? `bg-transparent border-y py-6 ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"}` : 'px-4 py-[14px]'}`}>
                <div className={`grid gap-4 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
                    {renderWeatherBlock("ТЕМПЕРАТУРА", activeStats.tempRange.split("..",)[0] + "°", `..${activeStats.tempRange.split("..",)[1]}°`, temperatureSubValue)}
                    <div className="flex flex-col">
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
        )
    );

    const renderRouteName = () => (
        activeStats && (
            <div className={`${isDesktop ? 'border-y' : 'px-4 py-[14px] mt-0 border-t'} ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"}`}>
                {isDesktop ? (
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 py-6">
                            <p className="text-xs text-neutral-400">МАРШРУТ</p>
                            <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
                                {routeStartCity}—{routeEndCity}
                            </p>
                        </div>
                        <div className="flex items-center justify-start gap-[16px] mt-[6px]">
                            <button
                                onClick={handleForwardGpx}
                                className="group relative focus:outline-none"
                            >
                                <ShareIcon width="24" height="24" className={`${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] transition-colors`} />
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                                    <div className={`absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                    Отправить
                                </div>
                            </button>

                            <button
                                onClick={handleDownloadGpx}
                                className="group relative focus:outline-none"
                            >
                                <GpxIcon width="24" height="24" className={`${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] transition-colors`} />
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                                    <div className={`absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                    Скачать
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-xs text-neutral-400">МАРШРУТ</p>
                        <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
                            {routeStartCity}—{routeEndCity}
                        </p>
                    </div>
                )}
            </div>
        )
    );

    const renderRouteStats = () => (
        currentRouteData && (
            <div className={`${isDesktop ? '' : 'px-4 pb-[14px]'} grid grid-cols-2 md:grid-cols-4 gap-4`}>
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
                                className={`w-5 h-5 flex items-center justify-center text-lg leading-none pb-0.5 -translate-x-0.5 text-neutral-400 ${isDark ? "hover:text-[#D9D9D9] hover:bg-[#333333]" : "hover:text-black hover:bg-gray-200"} rounded transition-colors`}
                            >
                                −
                            </button>
                            <button 
                                onClick={() => setSpeed(s => Math.min(38, s + 1))} 
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
                        {calculateDuration(currentRouteData.distanceKm, speed)}
                    </p>
                </div>
            </div>
        )
    );

    const renderMap = () => (
        <div 
            className={`${isMapFullscreen ? "fixed inset-0 z-50" : "relative"} ${isDesktop && !isMapFullscreen ? `border rounded-lg ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"}` : ""}`}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
        >
            <MapView 
                key={routeDay || "map"}
                cityCoords={cityCoords}
                currentRouteData={currentRouteData}
                routeStatus={routeStatus}
                markers={markers}
                windDeg={activeStats?.windDeg}
                windSpeed={activeStats?.windRange}
                windDirection={activeStats?.windDirection}
                isDark={isDark}
                onFullscreenToggle={setIsMapFullscreen}
                routeCount={foundRoutes.length}
                selectedRouteIdx={selectedRouteIdx}
                onRouteSelect={setSelectedRouteIdx}
                pace={speed}
                onTargetSpeedChange={setSpeed}
                startTemp={activeStats?.startTemperature}
                endTemp={activeStats?.endTemperature}
                elevationCursor={elevationHoverPoint ? [elevationHoverPoint.lat, elevationHoverPoint.lon] : null}
                onElevationHover={setElevationHoverPoint}
                hourlyWind={activeStats?.hourlyWind}
                hourlyWindDir={activeStats?.hourlyWindDir}
                isMountainRegion={isMountainCity}
                startCityName={routeStartCity}
                endCityName={routeEndCity}
            />
            {isMapFullscreen && currentRouteData && (
                <div 
                    className={`absolute bottom-0 left-0 right-0 z-[60] p-4 pb-8 ${isDark ? "bg-[#111111]/90" : "bg-white/90"}`}
                >
                     <ElevationProfile 
                        routeData={currentRouteData}
                        isDark={isDark}
                        targetSpeed={speed}
                        isMountainRegion={isMountainCity}
                        onHover={setElevationHoverPoint}
                        startTemp={activeStats?.startTemperature}
                        endTemp={activeStats?.endTemperature}
                        hourlyWind={activeStats?.hourlyWind}
                        hourlyWindDir={activeStats?.hourlyWindDir}
                        height={150}
                        variant="default"
                     />
                </div>
            )}
        </div>
    );

    const renderProfile = () => (
        !isMapFullscreen && currentRouteData && (
            <div 
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                className={isDesktop ? "pt-2" : ""}
            >
                <ElevationProfile 
                    routeData={currentRouteData} 
                    isDark={isDark} 
                    targetSpeed={speed} 
                    isMountainRegion={isMountainCity}
                    onHover={setElevationHoverPoint}
                    startTemp={activeStats?.startTemperature}
                    endTemp={activeStats?.endTemperature}
                    hourlyWind={activeStats?.hourlyWind}
                    hourlyWindDir={activeStats?.hourlyWindDir}
                    variant="inline"
                />
            </div>
        )
    );

    const renderDownloads = () => (
        <div className={`grid gap-4 ${isDesktop ? '' : 'px-4 pt-4 pb-2'} ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {canShare && !isDesktop && (
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleForwardGpx(); }}
                    className={`text-sm ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] flex items-baseline gap-0.5`}
                >
                    <span className="underline decoration-1 underline-offset-4">Отправить</span>
                    <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(45deg)", position: "relative", top: "7px", left: "-2px" }} />
                </a>
            )}
            <a
                href="#"
                onClick={(e) => { 
                    e.preventDefault(); 
                    handleDownloadGpx();
                }}
                className={`text-sm ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] flex items-baseline gap-0.5`}
            >
                <span className="underline decoration-1 underline-offset-4">{isDesktop ? "Скачать" : "Открыть"}</span>
                <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: isDesktop ? "rotate(135deg)" : "rotate(45deg)", position: "relative", top: "7px", left: "-2px" }} />
            </a>
        </div>
    );

    const getDistanceLabel = (dist: number) => {
        if (dist > 160) return "Большой";
        if (dist >= 120) return "Объемный";
        return "Короткий";
    };

    const renderDetails = () => {
        const hasOpenSection = Object.values(openSections).some(Boolean);
        const inactiveColor = isDark ? 'text-[#777777]' : 'text-[#B2B2B2]';
        const activeColor = isDark ? 'text-[#D9D9D9]' : 'text-[#111111]';
        const linkClass = (baseClass: string) => 
            `${baseClass} ${!isDesktop && hasOpenSection ? inactiveColor : activeColor} ${isDark ? 'hover:text-[#AAAAAA]' : 'hover:text-[#777777]'}`;

        return (
            <div className={`${isDesktop ? '' : 'mt-[22px] px-4 pb-4 pt-[22px] mb-12 border-t'} ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"} flex flex-col gap-4`}>
                
                {/* Transport & Places Group */}
                <div className="flex flex-wrap gap-4 w-full">
                    {routeStartCity !== "Москва" && (
                        <a
                            href={activeStats?.dateObj ? generateTransportLink("Москва", routeStartCity, activeStats.dateObj) : "#"}
                            className={linkClass(`flex-1 min-w-full md:min-w-[45%] flex items-center md:items-start text-xl font-unbounded font-medium text-left py-px`)}
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
                            className={linkClass(`flex-1 min-w-full md:min-w-[45%] flex items-center md:items-start text-xl font-unbounded font-medium text-left py-px`)}
                            target="_blank"
                        >
                            <div className="flex flex-col">
                                <span className="flex items-center">Обратно<RoutesIcon width="22" height="22" /></span>
                                <span className="text-sm text-[#666666] station-name">{endStation} – {endMoscowStation}</span>
                            </div>
                        </a>
                    )}

                    {/* Где поесть - mobile only - in first group */}
                    {!isDesktop && (
                        <div className="flex flex-col flex-1 min-w-full md:min-w-[45%]">
                            <button
                                className={`text-xl font-unbounded font-medium text-left py-px ${
                                    openSections["еда"]
                                        ? activeColor 
                                        : inactiveColor
                                } ${isDark ? "hover:text-[#AAAAAA]" : "hover:text-[#777777]"}`}
                                onClick={() => toggleSection("еда")}
                            >
                                <span className="flex items-center">Где поесть<ArrowDown isOpen={!!openSections["еда"]} width="23" height="23" style={{ top: "-7px" }} /></span>
                            </button>
                            <AccordionContent isOpen={!!openSections["еда"]}>
                                <div className="mt-2 flex flex-wrap gap-0">
                                    <a
                                        href={routeStartCity === "Завидово" ? "https://yandex.ru/maps/?ll=36.530439%2C56.587207&z=14" : `https://yandex.ru/maps/?text=${encodeURIComponent(routeStartCity)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                                    >
                                        На старте
                                    </a>
                                    <a
                                        href={routeEndCity === "Завидово" ? "https://yandex.ru/maps/?ll=36.530439%2C56.587207&z=14" : `https://yandex.ru/maps/?text=${encodeURIComponent(routeEndCity)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                                    >
                                        На финише
                                    </a>
                                </div>
                            </AccordionContent>
                        </div>
                    )}

                    {/* Separator - Desktop only - inside the group */}
                    {isDesktop && (
                        <div className={`w-full border-t ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"}`}></div>
                    )}
                </div>

                {/* Info Group: Wear, Food & Profile */}
                <div className={`grid grid-cols-1 ${isDesktop ? 'grid-cols-2' : 'md:grid-cols-2'} gap-4 w-full`}>
                    {/* What to wear - for mobile only in second position */}
                    {!isDesktop && (
                        <div className="flex flex-col">
                            <button
                                className={`text-xl font-unbounded font-medium text-left py-px ${
                                    openSections["одежда"]
                                        ? activeColor 
                                        : inactiveColor
                                } ${isDark ? "hover:text-[#AAAAAA]" : "hover:text-[#777777]"}`}
                                onClick={() => toggleSection("одежда")}
                            >
                                <span className="flex items-center">Что надеть<ArrowDown isOpen={!!openSections["одежда"]} width="23" height="23" style={{ top: "-7px" }} /></span>
                            </button>
                            <AccordionContent isOpen={!!openSections["одежда"]}>
                                {activeStats?.clothingHints && activeStats.clothingHints.length > 0 ? (
                                    <div className="mt-0 flex flex-wrap pl-0">
                                        {activeStats.clothingHints.map((hint: string) => (
                                            <span
                                                key={hint}
                                                className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 transition-colors duration-100`}
                                            >
                                                {hint}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`mt-0 pl-0 ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} text-sm`}>
                                        Подскажем, что надеть на райд, когда погода наладится: нужно, чтобы было без осадков и теплее +5º
                                    </div>
                                )}
                            </AccordionContent>
                        </div>
                    )}

                    {/* What to wear - for desktop - first position */}
                    {isDesktop && (
                        <div className="flex flex-col">
                            <button
                                className={`text-xl font-unbounded font-medium text-left py-px ${
                                    openSections["одежда"]
                                        ? activeColor 
                                        : inactiveColor
                                } ${isDark ? "hover:text-[#AAAAAA]" : "hover:text-[#777777]"}`}
                                onClick={() => toggleSection("одежда")}
                            >
                                <span className="flex items-center">Что надеть<ArrowDown isOpen={!!openSections["одежда"]} width="23" height="23" style={{ top: "-7px" }} /></span>
                            </button>
                            <AccordionContent isOpen={!!openSections["одежда"]}>
                                {activeStats?.clothingHints && activeStats.clothingHints.length > 0 ? (
                                    <div className="mt-0 flex flex-wrap pl-0">
                                        {activeStats.clothingHints.map((hint: string) => (
                                            <span
                                                key={hint}
                                                className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 transition-colors duration-100`}
                                            >
                                                {hint}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`mt-0 pl-0 ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} text-sm`}>
                                        Подскажем, что надеть на райд, когда погода наладится: нужно, чтобы было без осадков и теплее +5º
                                    </div>
                                )}
                            </AccordionContent>
                        </div>
                    )}

                    {/* Profile - second position for desktop */}
                    <div className="flex flex-col">
                        <button
                            className={`text-xl font-unbounded font-medium text-left py-px ${
                                openSections["детали"] 
                                    ? activeColor 
                                    : inactiveColor
                            } ${isDark ? "hover:text-[#AAAAAA]" : "hover:text-[#777777]"}`}
                            onClick={() => toggleSection("детали")}
                        >
                            <span className="flex items-center">Профиль<ArrowDown isOpen={!!openSections["детали"]} width="23" height="23" style={{ top: "-7px" }} /></span>
                        </button>
                        <AccordionContent isOpen={!!openSections["детали"]}>
                            <div className="mt-0 flex flex-wrap pl-0 gap-0">
                                <div className="relative inline-block">
                                    <button 
                                        className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDesktop) {
                                                setShowProfileTooltip(!showProfileTooltip);
                                            } else {
                                                setActiveSliderContent("Общий набор высоты обманчив: 800 метров могут быть пологими или крутыми «стенками». ProfileScore показывает реальную сложность, оценивая «убойность» горок. Баллы зависят от крутизны и момента: подъем на финише «дороже», чем на старте. Высокий ProfileScore при малом наборе значит, что маршрут коварен и тяжелое в конце. (Формула ProCyclingStats)");
                                            }
                                        }}
                                        onMouseEnter={() => isDesktop && setShowProfileTooltip(true)}
                                        onMouseLeave={() => isDesktop && setShowProfileTooltip(false)}
                                    >
                                        Profile Score {profileScore}
                                    </button>
                                    
                                    {showProfileTooltip && (
                                        <div 
                                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] md:w-[320px] p-4 rounded-xl shadow-xl text-sm leading-tight z-50 ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Общий набор высоты обманчив: 800 метров могут быть пологими или крутыми «стенками». ProfileScore показывает реальную сложность, оценивая «убойность» горок. Баллы зависят от крутизны и момента: подъем на финише «дороже», чем на старте. Высокий ProfileScore при малом наборе значит, что маршрут коварен и тяжелое в конце. (Формула ProCyclingStats)
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative inline-block">
                                    <button 
                                        className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDesktop) {
                                                setShowDifficultyTooltip(!showDifficultyTooltip);
                                            } else {
                                                setActiveSliderContent("С психологической точки зрения важно заранее понимать характер маршрута. Будет ли это монотонная работа или проверка на силу и выносливость, где придется потерпеть? Речь о влиянии рельефа на ощущения от катания. Тяжелый – Profile Score выше 20. Бодрый – от 12 до 20. Легкий – менее 12.");
                                            }
                                        }}
                                        onMouseEnter={() => isDesktop && setShowDifficultyTooltip(true)}
                                        onMouseLeave={() => isDesktop && setShowDifficultyTooltip(false)}
                                    >
                                        {getDifficultyLabel(profileScore)}
                                    </button>
                                    
                                    {showDifficultyTooltip && (
                                        <div 
                                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] md:w-[320px] p-4 rounded-xl shadow-xl text-sm leading-tight z-50 ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            С психологической точки зрения важно заранее понимать характер маршрута. Будет ли это монотонная работа или проверка на силу и выносливость, где придется потерпеть? Речь о влиянии рельефа на ощущения от катания. Тяжелый – Profile Score выше 20. Бодрый – от 12 до 20. Легкий – менее 12.
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative inline-block">
                                    <button 
                                        className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDesktop) {
                                                setShowDistanceTooltip(!showDistanceTooltip);
                                            } else {
                                                setActiveSliderContent("Большой маршрут – дистанция райда выше 160 км. Объемный – от 120 до 160 км. Короткий – менее 120 км.");
                                            }
                                        }}
                                        onMouseEnter={() => isDesktop && setShowDistanceTooltip(true)}
                                        onMouseLeave={() => isDesktop && setShowDistanceTooltip(false)}
                                    >
                                        {getDistanceLabel(currentRouteData?.distanceKm || 0)}
                                    </button>
                                    
                                    {showDistanceTooltip && (
                                        <div 
                                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] md:w-[320px] p-4 rounded-xl shadow-xl text-sm leading-tight z-50 ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Большой маршрут – дистанция райда выше 160 км. Объемный – от 120 до 160 км. Короткий – менее 120 км.
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative inline-block">
                                    <button 
                                        className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDesktop) {
                                                setShowPaceTooltip(!showPaceTooltip);
                                            } else {
                                                setActiveSliderContent("Темповой – средняя скорость в движении должна быть выше 33 км/ч. Такая средняя необходима как условие для большого райда от 160 до 200 км. Прогулочный – оптимальная средняя от 30 до 33 км/ч. ");
                                            }
                                        }}
                                        onMouseEnter={() => isDesktop && setShowPaceTooltip(true)}
                                        onMouseLeave={() => isDesktop && setShowPaceTooltip(false)}
                                    >
                                        {(currentRouteData?.distanceKm || 0) > 160 ? "Темповой" : "Прогулочный"}
                                    </button>
                                    
                                    {showPaceTooltip && (
                                        <div 
                                            className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] md:w-[320px] p-4 rounded-xl shadow-xl text-sm leading-tight z-50 ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Темповой – средняя скорость в движении должна быть выше 33 км/ч. Такая средняя необходима как условие для большого райда от 160 до 200 км. Прогулочный – оптимальная средняя от 30 до 33 км/ч. 
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </AccordionContent>
                    </div>

                    {/* Где поесть - third for desktop */}
                    {isDesktop && (
                        <div className="flex flex-col">
                            <button
                                className={`text-xl font-unbounded font-medium text-left py-px ${
                                    openSections["еда"]
                                        ? activeColor 
                                        : inactiveColor
                                } ${isDark ? "hover:text-[#AAAAAA]" : "hover:text-[#777777]"}`}
                                onClick={() => toggleSection("еда")}
                            >
                                <span className="flex items-center">Где поесть<ArrowDown isOpen={!!openSections["еда"]} width="23" height="23" style={{ top: "-7px" }} /></span>
                            </button>
                            <AccordionContent isOpen={!!openSections["еда"]}>
                                <div className="mt-2 flex flex-wrap gap-0">
                                    <a
                                        href={routeStartCity === "Завидово" ? "https://yandex.ru/maps/?ll=36.530439%2C56.587207&z=14" : `https://yandex.ru/maps/?text=${encodeURIComponent(routeStartCity)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                                    >
                                        На старте
                                    </a>
                                    <a
                                        href={routeEndCity === "Завидово" ? "https://yandex.ru/maps/?ll=36.530439%2C56.587207&z=14" : `https://yandex.ru/maps/?text=${encodeURIComponent(routeEndCity)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                                    >
                                        На финише
                                    </a>
                                </div>
                            </AccordionContent>
                        </div>
                    )}
                </div>

            </div>
        );
    };

    if (isDesktop) {
        return (
            <div className={`w-full ${isDark ? "text-[#D9D9D9]" : "text-black"} transition-colors duration-700`}>
                {/* Header: Burger + Days */}
                <div className="w-full mb-6 flex items-center gap-4">
                    {onToggleSlider && (
                        <button onClick={onToggleSlider} className={`p-2 ml-[7px] ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    )}
                    <div className="flex items-center overflow-x-auto no-scrollbar whitespace-nowrap gap-4">
                        {allAvailableDays.map((dayItem: any) => {
                            const isSelected = dayItem.date.getTime().toString() === routeDay;
                            const dateFormatted = `${dayItem.date.getDate()} ${getShortMonthName(dayItem.date)}`;
                            
                            return (
                                <button
                                    key={`${dayItem.weekend || ''}-${dayItem.id}-${dayItem.date.getTime()}`}
                                    className={`text-[26px] font-unbounded font-medium shrink-0 transition-colors duration-200 ${
                                        isSelected 
                                            ? (isDark ? "text-[#D9D9D9]" : "text-[#111111]") 
                                            : (isDark ? "text-[#777777] hover:text-[#aaaaaa]" : "text-[#B2B2B2] hover:text-[#777777]")
                                    }`}
                                    onClick={() => setRouteDay(dayItem.date.getTime().toString())}
                                >
                                    <span className="flex items-baseline gap-1">
                                        <span>{dayItem.label}</span>
                                        <span className="text-xs font-sans transform -translate-y-3">
                                            {dateFormatted}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-[5%]">
                    {/* Left Column 45% */}
                    <div className="w-[45%] flex flex-col gap-6 pl-4">
                        {renderRouteName()}
                        {renderRouteStats()}
                        {renderWeatherSection()}
                        {/* Transport, Places, Wear - reusing renderDetails but simplified logic inside */}
                        {renderDetails()}
                    </div>

                    {/* Right Column 55% */}
                    <div className="w-[55%] flex flex-col gap-6">
                        {renderMap()}
                        {renderProfile()}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`mx-auto flex-grow flex flex-col w-full ${isDark ? "text-[#D9D9D9]" : "text-black"} transition-colors duration-700`} style={{ backgroundColor: isDark ? "#111111" : "#F5F5F5" }}>
            <div className={`sticky top-0 z-10 pt-2 pb-2 border-b ${isDark ? "bg-[#111111] border-[#333333]" : "bg-[#F5F5F5] border-[#D9D9D9]"} transition-colors duration-700`}>
                <div className="flex items-center px-4 overflow-x-auto no-scrollbar whitespace-nowrap gap-4">
                    {allAvailableDays.map((dayItem: any) => {
                        const isSelected = dayItem.date.getTime().toString() === routeDay;
                        const dateFormatted = `${dayItem.date.getDate()} ${getShortMonthName(dayItem.date)}`;
                        
                        return (
                            <button
                                key={`${dayItem.weekend || ''}-${dayItem.id}-${dayItem.date.getTime()}`}
                                ref={isSelected ? activeDayRef : null}
                                className={`text-[26px] font-unbounded font-medium shrink-0 transition-colors duration-200 ${
                                    isSelected 
                                        ? (isDark ? "text-[#D9D9D9]" : "text-[#111111]") 
                                        : (isDark ? "text-[#777777] hover:text-[#aaaaaa]" : "text-[#B2B2B2] hover:text-[#777777]")
                                }`}
                                onClick={() => {
                                    if (isSelected) {
                                        onClose();
                                    } else {
                                        setRouteDay(dayItem.date.getTime().toString());
                                    }
                                }}
                            >
                                <span className="flex items-baseline gap-1">
                                    <span>{dayItem.label}</span>
                                    <span className="text-xs font-sans transform -translate-y-3">
                                        {dateFormatted}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div 
                className="overflow-y-auto flex-1"
            >
                {renderWeatherSection()}
                
                {renderRouteName()}
                
                {renderRouteStats()}

                {renderMap()}

                {renderProfile()}

                {renderDownloads()}
                
                {renderDetails()}
            </div>

            <BottomSlider 
                isOpen={activeSliderContent !== null}
                onClose={() => setActiveSliderContent(null)}
                content={activeSliderContent}
                isDark={isDark}
            />
        </div>
    );
};

export default CityDetail;

import React, { useState, useEffect, useMemo, useRef } from "react";
import { CityAnalysisResult } from "../types";
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from "../config/constants";
import { getCardinal } from "../services/weatherService";
import { parseGpx, getDistanceFromLatLonInKm, RouteData } from "../services/gpxUtils";
import { ElevationPoint, calculateProfileScore } from "../utils/elevationUtils";
import { useRideAnnouncement } from "../hooks/useRideAnnouncement";
import { MapView } from "./MapView";
import ElevationProfile from "./ElevationProfile";
import BottomSlider from "./BottomSlider";
import AnnouncementModal from "./AnnouncementModal";
import CityWeather from "./city/CityWeather";
import CityRouteStats from "./city/CityRouteStats";
import CityDownloads from "./city/CityDownloads";
import CityDetails from "./city/CityDetails";
import { generateTransportLink, getStationName, getMoscowStationName } from "../utils/transportUtils";
import { getDifficultyLabel, getDistanceLabel } from "../utils/elevationUtils";

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
    const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(isDesktop ? { "одежда": true, "детали": true, "еда": true, "спортпит": true } : {});
    const [isMapFullscreen, setIsMapFullscreen] = useState(false);
    const [speed, setSpeed] = useState<number>(30);
    const [elevationHoverPoint, setElevationHoverPoint] = useState<ElevationPoint | null>(null);
    
    // Tooltips
    const [showProfileTooltip, setShowProfileTooltip] = useState(false);
    const [showDifficultyTooltip, setShowDifficultyTooltip] = useState(false);
    const [showDistanceTooltip, setShowDistanceTooltip] = useState(false);
    const [showPaceTooltip, setShowPaceTooltip] = useState(false);
    const [showBidonsTooltip, setShowBidonsTooltip] = useState(false);
    const [showGelBarTooltip, setShowGelBarTooltip] = useState(false);
    
    const [activeSliderContent, setActiveSliderContent] = useState<string | null>(null);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    
    const { generate: generateAnnouncement, isGenerating: isGeneratingAI, announcement: aiAnnouncement } = useRideAnnouncement();
    const lastClickTimeRef = useRef<number>(0);

    const toggleSection = (section: string) => {
        if (!isDesktop) {
            const isCurrentlyOpen = openSections[section];
            setOpenSections({
                одежда: false,
                детали: false,
                еда: false,
                спортпит: false,
                [section]: !isCurrentlyOpen
            });
        } else {
            setOpenSections(prev => ({
                ...prev,
                [section]: !prev[section]
            }));
        }
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

    const calculateDuration = (distKm: number, speedKmH: number) => {
        let hours = Math.floor(distKm / speedKmH);
        let minutes = Math.round((distKm / speedKmH - hours) * 60);

        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    const calculateDurationMinutes = (distKm: number, speedKmH: number) => {
        return Math.round((distKm / speedKmH) * 60);
    };

    const sportNutrition = useMemo(() => {
        if (!currentRouteData) return { bidons: 0, gels: 0 };
        const durationMinutes = calculateDurationMinutes(currentRouteData.distanceKm, speed);
        const bidons = Math.ceil(durationMinutes / 80);
        const gels = Math.ceil(durationMinutes / 40);
        return { bidons, gels };
    }, [currentRouteData, speed]);

    const profileScore = useMemo(() => {
        if (!currentRouteData) return 0;
        return calculateProfileScore(currentRouteData.points, currentRouteData.cumulativeDistances);
    }, [currentRouteData]);

    const generateSummaryText = () => {
        if (!activeStats || !currentRouteData) return null;

        const date = activeStats.dateObj;
        const dayName = activeStats.dayName;
        const route = `${routeStartCity}—${routeEndCity}`;
        const distance = currentRouteData.distanceKm.toFixed(0);
        const elevation = Math.round(currentRouteData.elevationM);
        const duration = calculateDuration(currentRouteData.distanceKm, speed);
        const pace = speed;
        const profileScoreValue = profileScore;
        const difficulty = getDifficultyLabel(profileScoreValue);
        const distanceLabel = getDistanceLabel(currentRouteData.distanceKm);
        const paceLabel = currentRouteData.distanceKm > 160 ? "Темповой" : "Прогулочный";
        const temp = activeStats.tempRange;
        const windDir = activeStats.windDirection;
        const windSpeed = activeStats.windRange;
        const sun = activeStats.sunStr.split(" ")[0];
        const clothing = activeStats.clothingHints?.join(", ") || "Подскажем, что надеть, когда погода наладится";
        const bidons = sportNutrition.bidons;
        const gels = sportNutrition.gels;

        const dateStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;

        const toLink = routeStartCity !== "Москва" ? generateTransportLink("Москва", routeStartCity, date) : "";
        const fromLink = routeEndCity !== "Москва" ? generateTransportLink(routeEndCity, "Москва", date) : "";
        
        const startStation = getStationName(routeStartCity);
        const endStation = getStationName(routeEndCity);
        const startMoscowStation = getMoscowStationName(routeStartCity);
        const endMoscowStation = getMoscowStationName(routeEndCity);

        const toStationInfo = routeStartCity !== "Москва" ? `${startMoscowStation} → ${startStation}` : "";
        const fromStationInfo = routeEndCity !== "Москва" ? `${endStation} → ${endMoscowStation}` : "";

        const foodStartLink = routeStartCity === "Завидово" 
            ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" 
            : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeStartCity)}`;
        const foodEndLink = routeEndCity === "Завидово" 
            ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" 
            : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeEndCity)}`;

        return `Едем по маршруту ${route} ${dateStr}, ${dayName}.
Дистанция: ${distance} км / ${elevation} м набора.
В седле примерно ${duration} при темпе ${pace} км/ч.
Характер маршрута: ${distanceLabel}, ${paceLabel}.
Влияние рельефа на ощущения от райда: ProfileScore ${profileScoreValue}, ${difficulty}.

Погода: ${temp}º, ветер ${windDir}, ${windSpeed} км/ч. Солнца будет примерно ${sun} часа(ов).
Рекомендация по одежде: ${clothing}

Доберемся туда (${toStationInfo}): ${toLink}
Вернемся обратно (${fromStationInfo}): ${fromLink}

Спортпит: пьем ${bidons} бидона(ов) изотоника и едим ${gels} гелей/батончиков.
 
Где поесть на старте: ${foodStartLink}

Где поесть на финише: ${foodEndLink}.`;
    };

    const handleGenerateAIAnnouncement = async () => {
        const now = Date.now();
        if (now - lastClickTimeRef.current < 12000) {
            return;
        }
        lastClickTimeRef.current = now;

        const text = generateSummaryText();
        if (!text) return;

        try {
            await generateAnnouncement(text);
            setShowAnnouncementModal(true);
        } catch (error) {
            alert(`Упс! ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
        }
    };

    const renderRouteName = () => (
        activeStats && (
            <div className={`${isDesktop ? 'border-y' : 'px-4 py-[14px] mt-0 border-t'} ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"}`}>
                {isDesktop ? (
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 py-4">
                            <p className="text-xs text-neutral-400">МАРШРУТ</p>
                            <p className={`text-base font-unbounded font-medium ${isDark ? "text-[#D9D9D9]" : "text-black"}`}>
                                {routeStartCity}—{routeEndCity}
                            </p>
                        </div>
                        <div className="flex items-center justify-start gap-[16px] mt-[6px]">
                            <CityDownloads 
                                isDesktop={true}
                                isDark={isDark}
                                canShare={canShare}
                                isGeneratingAI={isGeneratingAI}
                                onForward={handleForwardGpx}
                                onDownload={handleDownloadGpx}
                                onGenerate={handleGenerateAIAnnouncement}
                            />
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
                markers={[]}
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
                isMountainRegion={FLIGHT_CITIES.includes(data.cityName)} // Approximate check, ideally use MOUNTAIN_CITIES
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
                        isMountainRegion={FLIGHT_CITIES.includes(data.cityName)}
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

    const renderProfile = () => null;

    if (isDesktop) {
        return (
            <div className={`w-full ${isDark ? "text-[#D9D9D9]" : "text-black"} transition-colors duration-700`}>
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

                <div className="flex gap-[4%]">
                    <div className="w-[48%] flex flex-col gap-6 pl-4">
                        {renderRouteName()}
                        {currentRouteData && (
                            <CityRouteStats 
                                routeData={currentRouteData} 
                                speed={speed} 
                                setSpeed={setSpeed} 
                                isDesktop={isDesktop} 
                                isDark={isDark} 
                            />
                        )}
                        {activeStats && (
                            <CityWeather 
                                stats={activeStats} 
                                cityName={data.cityName} 
                                isDesktop={isDesktop} 
                                isDark={isDark} 
                            />
                        )}
                        <CityDetails 
                            routeStartCity={routeStartCity}
                            routeEndCity={routeEndCity}
                            activeStats={activeStats}
                            currentRouteData={currentRouteData}
                            profileScore={profileScore}
                            sportNutrition={sportNutrition}
                            isDesktop={isDesktop}
                            isDark={isDark}
                            openSections={openSections}
                            toggleSection={toggleSection}
                            setActiveSliderContent={setActiveSliderContent}
                            setShowProfileTooltip={setShowProfileTooltip}
                            setShowDifficultyTooltip={setShowDifficultyTooltip}
                            setShowDistanceTooltip={setShowDistanceTooltip}
                            setShowPaceTooltip={setShowPaceTooltip}
                            setShowBidonsTooltip={setShowBidonsTooltip}
                            setShowGelBarTooltip={setShowGelBarTooltip}
                            showProfileTooltip={showProfileTooltip}
                            showDifficultyTooltip={showDifficultyTooltip}
                            showDistanceTooltip={showDistanceTooltip}
                            showPaceTooltip={showPaceTooltip}
                            showBidonsTooltip={showBidonsTooltip}
                            showGelBarTooltip={showGelBarTooltip}
                        />
                    </div>

                    <div className="w-[48%] flex flex-col gap-6">
                        {renderMap()}
                        {renderProfile()}
                    </div>
                </div>

                <AnnouncementModal
                    isOpen={showAnnouncementModal}
                    onClose={() => setShowAnnouncementModal(false)}
                    content={aiAnnouncement || ""}
                    isDark={isDark}
                />
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
                {activeStats && (
                    <CityWeather 
                        stats={activeStats} 
                        cityName={data.cityName} 
                        isDesktop={isDesktop} 
                        isDark={isDark} 
                    />
                )}
                
                {renderRouteName()}
                
                {currentRouteData && (
                    <CityRouteStats 
                        routeData={currentRouteData} 
                        speed={speed} 
                        setSpeed={setSpeed} 
                        isDesktop={isDesktop} 
                        isDark={isDark} 
                    />
                )}

                {renderMap()}

                {renderProfile()}

                {!isDesktop && (
                    <CityDownloads 
                        isDesktop={isDesktop}
                        isDark={isDark}
                        canShare={canShare}
                        isGeneratingAI={isGeneratingAI}
                        onForward={handleForwardGpx}
                        onDownload={handleDownloadGpx}
                        onGenerate={handleGenerateAIAnnouncement}
                    />
                )}
                
                <CityDetails 
                    routeStartCity={routeStartCity}
                    routeEndCity={routeEndCity}
                    activeStats={activeStats}
                    currentRouteData={currentRouteData}
                    profileScore={profileScore}
                    sportNutrition={sportNutrition}
                    isDesktop={isDesktop}
                    isDark={isDark}
                    openSections={openSections}
                    toggleSection={toggleSection}
                    setActiveSliderContent={setActiveSliderContent}
                    setShowProfileTooltip={setShowProfileTooltip}
                    setShowDifficultyTooltip={setShowDifficultyTooltip}
                    setShowDistanceTooltip={setShowDistanceTooltip}
                    setShowPaceTooltip={setShowPaceTooltip}
                    setShowBidonsTooltip={setShowBidonsTooltip}
                    setShowGelBarTooltip={setShowGelBarTooltip}
                    showProfileTooltip={showProfileTooltip}
                    showDifficultyTooltip={showDifficultyTooltip}
                    showDistanceTooltip={showDistanceTooltip}
                    showPaceTooltip={showPaceTooltip}
                    showBidonsTooltip={showBidonsTooltip}
                    showGelBarTooltip={showGelBarTooltip}
                />
            </div>

            <BottomSlider 
                isOpen={activeSliderContent !== null}
                onClose={() => setActiveSliderContent(null)}
                content={activeSliderContent}
                isDark={isDark}
            />

            <AnnouncementModal
                isOpen={showAnnouncementModal}
                onClose={() => setShowAnnouncementModal(false)}
                content={aiAnnouncement || ""}
                isDark={isDark}
            />
        </div>
    );
};

export default CityDetail;

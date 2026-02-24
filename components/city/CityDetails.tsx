import React, { useState } from "react";
import ArrowDown from "../icons/ArrowDown";
import RoutesIcon from "../icons/RoutesIcon";
import { 
    generateTransportLink, 
    getStationName, 
    getMoscowStationName 
} from "../../utils/transportUtils";
import { 
    getDifficultyLabel, 
    getDistanceLabel 
} from "../../utils/elevationUtils";
import AccordionContent from "../AccordionContent";
import { WeatherDayStats } from "../../types";
import { RouteData } from "../../services/gpxUtils";
import { CITY_PLACES } from "../../config/constants";

interface CityDetailsProps {
    routeStartCity: string;
    routeEndCity: string;
    activeStats: WeatherDayStats | null;
    currentRouteData?: RouteData;
    profileScore: number;
    sportNutrition: { bidons: number; gels: number };
    isDesktop: boolean;
    isDark: boolean;
    openSections: { [key: string]: boolean };
    toggleSection: (section: string) => void;
    setActiveSliderContent: (content: string) => void;
    setShowProfileTooltip: (show: boolean) => void;
    setShowDifficultyTooltip: (show: boolean) => void;
    setShowDistanceTooltip: (show: boolean) => void;
    setShowPaceTooltip: (show: boolean) => void;
    setShowBidonsTooltip: (show: boolean) => void;
    setShowGelBarTooltip: (show: boolean) => void;
    showProfileTooltip: boolean;
    showDifficultyTooltip: boolean;
    showDistanceTooltip: boolean;
    showPaceTooltip: boolean;
    showBidonsTooltip: boolean;
    showGelBarTooltip: boolean;
}

const CityDetails: React.FC<CityDetailsProps> = ({
    routeStartCity,
    routeEndCity,
    activeStats,
    currentRouteData,
    profileScore,
    sportNutrition,
    isDesktop,
    isDark,
    openSections,
    toggleSection,
    setActiveSliderContent,
    setShowProfileTooltip,
    setShowDifficultyTooltip,
    setShowDistanceTooltip,
    setShowPaceTooltip,
    setShowBidonsTooltip,
    setShowGelBarTooltip,
    showProfileTooltip,
    showDifficultyTooltip,
    showDistanceTooltip,
    showPaceTooltip,
    showBidonsTooltip,
    showGelBarTooltip
}) => {
    const inactiveColor = isDark ? 'text-[#777777]' : 'text-[#B2B2B2]';
    const activeColor = isDark ? 'text-[#D9D9D9]' : 'text-[#111111]';
    const linkClass = (baseClass: string) => 
        `${baseClass} ${!isDesktop && Object.values(openSections).some(Boolean) ? inactiveColor : activeColor} ${isDark ? 'hover:text-[#AAAAAA]' : 'hover:text-[#777777]'}`;

    const startStation = getStationName(routeStartCity);
    const endStation = getStationName(routeEndCity);
    const startMoscowStation = getMoscowStationName(routeStartCity);
    const endMoscowStation = getMoscowStationName(routeEndCity);

    return (
        <div className={`${isDesktop ? '' : 'mt-[22px] px-4 pb-4 pt-[22px] mb-12 border-t'} ${isDark ? "border-[#333333]" : "border-[#D9D9D9]"} flex flex-col gap-4`}>
            
            {/* Transport & Places Group */}
            <div className="flex flex-wrap gap-4 w-full">
                {routeStartCity !== "Москва" && (
                    <a
                        href={activeStats?.dateObj ? generateTransportLink("Москва", routeStartCity, activeStats.dateObj) : "#"}
                        className={linkClass(`flex-1 min-w-full md:min-w-[45%] flex items-center md:items-start text-xl font-unbounded font-medium text-left py-px`)}
                        target="_blank"
                        rel="noreferrer"
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
                        rel="noreferrer"
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
                                    href={routeStartCity === "Завидово" ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeStartCity)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                                >
                                    На старте
                                </a>
                                <a
                                    href={routeEndCity === "Завидово" ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeEndCity)}`}
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
            <div className={`grid grid-cols-1 ${isDesktop ? 'grid-cols-2' : 'md:grid-cols-1'} gap-4 w-full`}>
                {/* What to wear - for mobile only */}
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

                {/* Профиль - for mobile only */}
                {!isDesktop && currentRouteData && (
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
                                <button 
                                    className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveSliderContent("Общий набор высоты обманчив: 800 метров могут быть пологими или крутыми «стенками». ProfileScore показывает реальную сложность, оценивая «убойность» горок. Баллы зависят от крутизны и момента: подъем на финише «дороже», чем на старте. Высокий ProfileScore при малом наборе значит, что маршрут коварен и тяжелое в конце. (Формула ProCyclingStats)");
                                    }}
                                >
                                    Profile Score {profileScore}
                                </button>
                                <button 
                                    className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveSliderContent("С психологической точки зрения важно заранее понимать характер маршрута. Будет ли это монотонная работа или проверка на силу и выносливость, где придется потерпеть? Речь о влиянии рельефа на ощущения от катания. Тяжелый – Profile Score выше 20. Бодрый – от 12 до 20. Легкий – менее 12.");
                                    }}
                                >
                                    {getDifficultyLabel(profileScore)}
                                </button>
                                <button 
                                    className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveSliderContent("Большой маршрут – дистанция райда выше 160 км. Объемный – от 120 до 160 км. Короткий – менее 120 км.");
                                    }}
                                >
                                    {getDistanceLabel(currentRouteData?.distanceKm || 0)}
                                </button>
                                <button 
                                    className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveSliderContent("Темповой – средняя скорость в движении должна быть выше 33 км/ч. Такая средняя необходима как условие для большого райда от 160 до 200 км. Прогулочный – оптимальная средняя от 30 до 33 км/ч.");
                                    }}
                                >
                                    {(currentRouteData?.distanceKm || 0) > 160 ? "Темповой" : "Прогулочный"}
                                </button>
                            </div>
                        </AccordionContent>
                    </div>
                )}

                {/* Спортпит - for mobile only */}
                {!isDesktop && currentRouteData && (
                    <div className="flex flex-col">
                        <button
                            className={`text-xl font-unbounded font-medium text-left py-px ${
                                openSections["спортпит"]
                                    ? activeColor 
                                    : inactiveColor
                            } ${isDark ? "hover:text-[#AAAAAA]" : "hover:text-[#777777]"}`}
                            onClick={() => toggleSection("спортпит")}
                        >
                            <span className="flex items-center">Спортпит<ArrowDown isOpen={!!openSections["спортпит"]} width="23" height="23" style={{ top: "-7px" }} /></span>
                        </button>
                        <AccordionContent isOpen={!!openSections["спортпит"]}>
                            <div className="mt-0 flex flex-wrap pl-0 gap-0">
                                <div className="relative inline-block">
                                    <button 
                                        className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveSliderContent("Изотоник — база, обеспечивающая водно-солевой баланс и часть энергии. Рекомендуется выпивать около 500 мл в час, делая небольшие глотки каждые 10–15 минут. Стандартный изотоник содержит около 30–45 г углеводов на 500 мл. Концентрированные напитки могут давать до 80 г углеводов, что снижает потребность в твердой пище. Когда жарко и сильно потеешь, добавляй в бачок солевые таблетки или выбирай изотоник с повышенным содержанием натрия, магния и калия, чтобы не было судорог.");
                                        }}
                                    >
                                        Bidons {sportNutrition.bidons}
                                    </button>
                                </div>
                                <div className="relative inline-block">
                                    <button 
                                        className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveSliderContent("Комбинируй разные источники энергии, чтобы избежать «вкусовой усталости» и перегрузки желудка. Батончики оптимальны в первой половине большого райда (более 3 часов), когда пульс не на пределе. Гели используй на высокой интенсивности, в горах или во второй половине райда. Один гель обычно содержит 20–30 г углеводов. Гель необходимо запивать 150–200 мл чистой воды (если это не гидрогель), иначе концентрация сахара может замедлить всасывание воды из кишечника. Начинай питаться с 20-30 минуты езды, не дожидаясь чувства голода. В течение 30 минут после финиша выпей рекавери с соотношением углеводов и белков 3:1 для быстрого восполнения гликогена.");
                                        }}
                                    >
                                        Gel/Bar {sportNutrition.gels}
                                    </button>
                                </div>
                            </div>
                        </AccordionContent>
                    </div>
                )}

                {/* What to wear - for desktop - first position */}
                {isDesktop && (
                    <div className="flex flex-col">
                        <div className={`text-xl font-unbounded font-medium text-left py-px ${activeColor}`}>
                            <span className="flex items-center">Что надеть</span>
                        </div>
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
                            <div className={`mt-1 pl-0 ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} text-sm`}>
                                Подскажем, что надеть на райд, когда погода наладится: нужно, чтобы было без осадков и теплее +5º
                            </div>
                        )}
                    </div>
                )}

                {/* Profile - second position for desktop */}
                {isDesktop && currentRouteData && (
                <div className="flex flex-col">
                    <div className={`text-xl font-unbounded font-medium text-left py-px ${activeColor}`}>
                        <span className="flex items-center">Профиль</span>
                    </div>
                    <div className="mt-1 flex flex-wrap pl-0 gap-0">
                        <div className="relative inline-block">
                            <button 
                                className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isDesktop) {
                                        setShowProfileTooltip(!showProfileTooltip);
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
                </div>
                )}

                {/* Где поесть - third for desktop */}
                {isDesktop && (
                    <div className="flex flex-col">
                        <div className={`text-xl font-unbounded font-medium text-left py-px ${activeColor}`}>
                            <span className="flex items-center">Где поесть</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-0">
                            <a
                                href={routeStartCity === "Завидово" ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeStartCity)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                            >
                                На старте
                            </a>
                            <a
                                href={routeEndCity === "Завидово" ? "https://yandex.ru/maps/?bookmarks%5Bid%5D=b0a25cf5-b1bc-431d-bf0e-b7fe324c82ad&ll=36.534234%2C56.588437&mode=bookmarks&utm_campaign=bookmarks&utm_source=share&z=14" : `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks&text=${encodeURIComponent(routeEndCity)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                            >
                                На финише
                            </a>
                        </div>
                    </div>
                )}

                {/* Спортпит - Sport nutrition - fourth position for desktop */}
                {isDesktop && currentRouteData && (
                    <div className="flex flex-col">
                        <div className={`text-xl font-unbounded font-medium text-left py-px ${activeColor}`}>
                            <span className="flex items-center">Спортпит</span>
                        </div>
                        <div className="mt-1 flex flex-wrap pl-0 gap-0">
                            <div className="relative inline-block">
                                <button 
                                    className={`${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"} text-15 tracking-tighter rounded-full px-4 py-2 cursor-help focus:outline-none transition-colors duration-100`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isDesktop) {
                                            setShowBidonsTooltip(!showBidonsTooltip);
                                        }
                                    }}
                                    onMouseEnter={() => isDesktop && setShowBidonsTooltip(true)}
                                    onMouseLeave={() => isDesktop && setShowBidonsTooltip(false)}
                                >
                                    Bidons {sportNutrition.bidons}
                                </button>
                                
                                {showBidonsTooltip && (
                                    <div 
                                        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] md:w-[320px] p-4 rounded-xl shadow-xl text-sm leading-tight z-50 ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Изотоник — база, обеспечивающая водно-солевой баланс и часть энергии. Рекомендуется выпивать около 500 мл в час, делая небольшие глотки каждые 10–15 минут. Стандартный изотоник содержит около 30–45 г углеводов на 500 мл. Концентрированные напитки могут давать до 80 г углеводов, что снижает потребность в твердой пище. Когда жарко и сильно потеешь, добавляй в бачок солевые таблетки или выбирай изотоник с повышенным содержанием натрия, магния и калия, чтобы не было судорог.
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
                                            setShowGelBarTooltip(!showGelBarTooltip);
                                        }
                                    }}
                                    onMouseEnter={() => isDesktop && setShowGelBarTooltip(true)}
                                    onMouseLeave={() => isDesktop && setShowGelBarTooltip(false)}
                                >
                                    Gel/Bar {sportNutrition.gels}
                                </button>
                                
                                {showGelBarTooltip && (
                                    <div 
                                        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[280px] md:w-[320px] p-4 rounded-xl shadow-xl text-sm leading-tight z-50 ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Комбинируй разные источники энергии, чтобы избежать «вкусовой усталости» и перегрузки желудка. Батончики оптимальны в первой половине большого райда (более 3 часов), когда пульс не на пределе. Гели используй на высокой интенсивности, в горах или во второй половине райда. Один гель обычно содержит 20–30 г углеводов. Гель необходимо запивать 150–200 мл чистой воды (если это не гидрогель), иначе концентрация сахара может замедлить всасывание воды из кишечника. Начинай питаться с 20-30 минуты езды, не дожидаясь чувства голода. В течение 30 минут после финиша выпей рекавери с соотношением углеводов и белков 3:1 для быстрого восполнения гликогена.
                                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default CityDetails;

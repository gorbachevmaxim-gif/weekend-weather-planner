import React, { useState, useMemo, useEffect } from "react";
import { CityAnalysisResult } from "../types";
import { useSummaryFiltering } from "../hooks/useSummaryFiltering";
import ArrowDown from "./icons/ArrowDown";
import ArrowUp from "./icons/ArrowUp";
import RoutesIcon from "./icons/RoutesIcon";
import GstrdnmcLogo from "./icons/GstrdnmcLogo";

// Helper component for smooth accordion animation !!!
const AccordionContent: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({ isOpen, children }) => (
  <div 
      className="grid transition-all duration-300 ease-in-out" 
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
  >
    <div className="overflow-hidden">
      {children}
    </div>
  </div>
);

interface NewSummaryViewProps {
  data: CityAnalysisResult[];
  onCityClick: (city: string, day: string) => void;
  onCityClickW2: (city: string, day: string) => void;
  theme?: "light" | "dark";
  toggleTheme?: () => void;
  contentPadding?: string;
  isDesktop?: boolean;
  onCommunityClick: () => void;
  onRulesClick: () => void;
}

const NewSummaryView: React.FC<NewSummaryViewProps> = ({ 
  data, 
  onCityClick, 
  onCityClickW2, 
  theme: propTheme, 
  contentPadding = "px-4",
  isDesktop = false,
  onCommunityClick,
  onRulesClick
}) => {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Local state as fallback if props not provided
  const [localTheme] = useState<"light" | "dark">(() => {
    return document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
  });

  const theme = propTheme || localTheme;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleSection = (section: string) => {
    if (!isDesktop) {
      setOpenSections(prev => prev.includes(section) ? [] : [section]);
      return;
    }

    if (section === "cities") {
      setOpenSections(prev => prev.includes("cities") ? [] : ["cities"]);
    } else {
      setOpenSections(prev => {
        if (prev.includes("cities")) {
          return [section];
        }
        return prev.includes(section) 
          ? prev.filter(s => s !== section)
          : [...prev, section];
      });
    }
  };

  const { sunnyCities: sunnyCitiesW1 } = useSummaryFiltering({ data, isSecondWeekend: false });
  const { sunnyCities: sunnyCitiesW2 } = useSummaryFiltering({ data, isSecondWeekend: true });

  const sortedCities = useMemo(() => {
    let sorted = [...data];
    sorted.sort((a, b) => a.cityName.localeCompare(b.cityName));
    return sorted.map(c => c.cityName);
  }, [data]);

  const sections = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const refCity1 = data.find(c => c.weekend1.saturday);
    const sat1Date = refCity1?.weekend1.saturday?.dateObj || data.find(c => c.weekend1.saturday)?.weekend1.saturday?.dateObj;
    const sun1Date = refCity1?.weekend1.sunday?.dateObj || data.find(c => c.weekend1.sunday)?.weekend1.sunday?.dateObj;

    const refCity2 = data.find(c => c.weekend2.saturday);
    const sat2Date = refCity2?.weekend2.saturday?.dateObj || data.find(c => c.weekend2.saturday)?.weekend2.saturday?.dateObj;
    const sun2Date = refCity2?.weekend2.sunday?.dateObj || data.find(c => c.weekend2.sunday)?.weekend2.sunday?.dateObj;

    // We only care about Saturdays and Sundays that are today or in the future
    // In this combined view, we group by "Saturday" and "Sunday"
    
    list.push({
        key: "saturday",
        label: "Суббота",
        date: sat1Date || sat2Date || new Date(0),
        w1Cities: sunnyCitiesW1.saturday,
        w2Cities: sunnyCitiesW2.saturday,
        isStandard: true
    });

    list.push({
        key: "sunday",
        label: "Воскресенье",
        date: sun1Date || sun2Date || new Date(86400000),
        w1Cities: sunnyCitiesW1.sunday,
        w2Cities: sunnyCitiesW2.sunday,
        isStandard: true
    });

    // Holidays handling (keeping it simple for now, can be improved if needed)
    const allHolidays = [...sunnyCitiesW1.holidays, ...sunnyCitiesW2.holidays];
    const holidayMap = new Map<string, any>();
    allHolidays.forEach(h => {
        const dateStr = h.dateObj.toISOString().split('T')[0];
        if (!holidayMap.has(dateStr)) {
            holidayMap.set(dateStr, { ...h, dateStr });
        }
    });

    Array.from(holidayMap.values()).forEach(h => {
        list.push({
            key: `holiday_${h.dateStr}`,
            label: h.dayName,
            date: h.dateObj,
            w1Cities: h.cities, // Adjust logic if holidays overlap W1/W2 differently
            w2Cities: [],
            isStandard: false,
            dateStr: h.dateStr
        });
    });

    const daySortOrder: { [key: string]: number } = {
        "Пятница": 1,
        "Суббота": 2,
        "Воскресенье": 3,
        "Понедельник": 4,
    };

    list.sort((a, b) => {
        const aOrder = daySortOrder[a.label] || 5;
        const bOrder = daySortOrder[b.label] || 5;

        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        
        return a.date.getTime() - b.date.getTime();
    });
    
    return list.filter(s => s.w1Cities.length > 0 || s.w2Cities.length > 0);
  }, [data, sunnyCitiesW1, sunnyCitiesW2]);

  const isDark = theme === "dark";

  const getCityScore = (city: CityAnalysisResult, section: any, isW2: boolean) => {
    if (section.isStandard) {
        const key = section.key as "saturday" | "sunday";
        const weekend = isW2 ? city.weekend2 : city.weekend1;
        return weekend[key]?.profileScore;
    }
    return city.extraDays?.find(d => d.dateStr === section.dateStr)?.profileScore;
  };

  return (
    <div>
      <div className="mt-0 space-y-1">
        {sections.map((section, index) => {
          const isOpen = openSections.includes(section.key);
          const isActive = isOpen;
          const isInactive = openSections.length > 0 && !isOpen;
          
          let textColorClass = "";
          if (isDark) {
            if (isActive) textColorClass = "text-[#D9D9D9] md:hover:text-[#777777]";
            else if (isInactive) textColorClass = "text-[#383838] hover:text-[#777777]";
            else textColorClass = "text-[#D9D9D9] hover:text-[#777777]";
          } else {
            if (isActive) textColorClass = "text-[#333333] md:hover:text-[#777777]";
            else if (isInactive) textColorClass = "text-[#B2B2B2] hover:text-[#777777]";
            else textColorClass = "text-[#333333] hover:text-[#777777]";
          }

          return (
            <div 
                key={section.key}
                className={`transition-all duration-500 ease-out transform ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
            >
              <button
                className={`w-full text-[30px] font-unbounded font-medium text-left ${contentPadding} py-1 px-0 ${textColorClass}`}
                onClick={() => toggleSection(section.key)}
              >
                <span className="flex items-center">{section.label}<ArrowDown isOpen={isOpen} width="20" height="20" style={{ top: "-7px" }} /></span>
              </button>
              <AccordionContent isOpen={isOpen}>
                <div className={`mt-0 ${contentPadding} space-y-[8px]`}>
                  {section.w1Cities.length > 0 && (
                    <div className="flex flex-wrap gap-0">
                      <div className={`${isDark ? "bg-[#777777] text-[#000000]" : "bg-[#333333] text-[#F3F3F3]"} text-[13px] tracking-tighter rounded-full px-4 py-2`}>Эти выходные</div>
                      {section.w1Cities.map((city: CityAnalysisResult) => {
                        const score = getCityScore(city, section, false);
                        return (
                          <button
                            key={city.cityName}
                            className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                            onClick={() => onCityClick(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
                          >
                            {city.cityName}{score !== undefined && <span className="text-[9px] relative -top-[3px] ml-1">{score}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {section.w2Cities.length > 0 ? (
                    <div className="flex flex-wrap gap-0">
                      <div className={`${isDark ? "bg-[#777777] text-[#000000]" : "bg-[#222222] text-[#F3F3F3]"} text-[13px] tracking-tighter rounded-full px-4 py-2`}>Через неделю</div>
                      {section.w2Cities.map((city: CityAnalysisResult) => {
                        const score = getCityScore(city, section, true);
                        return (
                          <button
                            key={city.cityName}
                            className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                            onClick={() => onCityClickW2(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
                          >
                            {city.cityName}{score !== undefined && <span className="text-[9px] relative -top-[3px] ml-1">{score}</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : section.key === 'saturday' ? (
                    <div className="flex flex-wrap gap-0">
                      <div className={`${isDark ? "bg-[#777777] text-[#000000]" : "bg-[#222222] text-[#F3F3F3]"} text-[13px] tracking-tighter rounded-full px-4 py-2`}>Через неделю</div>
                      <div className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black"}`}>Везде осадки</div>
                    </div>
                  ) : null}
                </div>
              </AccordionContent>
            </div>
          );
        })}
        <div 
            className={`transition-all duration-500 ease-out transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: `${sections.length * 50}ms` }}
        >
          <button
            className={`w-full text-[30px] font-unbounded font-medium text-left ${contentPadding} py-1 px-0 ${
                isDark 
                ? (openSections.includes("cities") ? "text-[#D9D9D9] md:hover:text-[#777777]" : (openSections.length === 0 ? "text-[#D9D9D9] hover:text-[#777777]" : "text-[#383838] hover:text-[#777777]"))
                : (openSections.includes("cities") ? "text-[#222222] md:hover:text-[#777777]" : (openSections.length === 0 ? "text-[#222222] hover:text-[#777777]" : "text-[#B2B2B2] hover:text-[#777777]"))
            }`}
            onClick={() => toggleSection("cities")}
          >
            <span className="flex items-center">Города<ArrowDown isOpen={openSections.includes("cities")} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          <AccordionContent isOpen={openSections.includes("cities")}>
            <div className={`mt-0 flex flex-wrap gap-0 ${contentPadding.replace('px-', 'pl-')}`}> 
                  {sortedCities.map((city: string) => (
                <button
                  key={city}
                  className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors duration-100 ${isDark ? "bg-[#222222] text-[#D9D9D9] hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                  onClick={() => onCityClick(city, "saturday")}
                >
                  {city}
                </button>
              ))}
            </div>
          </AccordionContent>
        </div>
        <div 
            className={`transition-all duration-500 ease-out transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: `${(sections.length + 1) * 50}ms` }}
        >
          <a
            href="https://www.komoot.com/collection/2674102/-lechappe-belle?ref=collection"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left ${contentPadding} py-1 px-0 hover:text-[#777777] ${
              isDark
              ? (openSections.length > 0 ? 'text-[#383838]' : 'text-[#D9D9D9]')
              : (openSections.length > 0 ? 'text-[#B2B2B2]' : 'text-[#333333]')
            }`}            
          >
            <span className="flex items-center">Маршруты<RoutesIcon width="19" height="19" style={{ top: "-7px" }} /></span>
          </a>
        </div>
        <div 
            className={`transition-all duration-500 ease-out transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: `${(sections.length + 2) * 50}ms` }}
        >
          <button
            onClick={onCommunityClick}
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left ${contentPadding} py-1 px-0 hover:text-[#777777] ${
              isDark
              ? (openSections.length > 0 ? 'text-[#383838]' : 'text-[#D9D9D9]')
              : (openSections.length > 0 ? 'text-[#B2B2B2]' : 'text-[#333333]')
            }`}            
          >
            <span className="flex items-center">Комьюнити<ArrowUp width="19" height="19" className="rotate-90" style={{ top: "-7px", position: "relative" }} /></span>
          </button>
        </div>
        <div 
            className={`transition-all duration-500 ease-out transform ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
            style={{ transitionDelay: `${(sections.length + 3) * 50}ms` }}
        >
          <button
            onClick={onRulesClick}
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left ${contentPadding} py-1 px-0 hover:text-[#777777] ${
              isDark
              ? (openSections.length > 0 ? 'text-[#383838]' : 'text-[#D9D9D9]')
              : (openSections.length > 0 ? 'text-[#B2B2B2]' : 'text-[#333333]')
            }`}            
          >
            <span className="flex items-center">Правила<ArrowUp width="19" height="19" className="rotate-90" style={{ top: "-7px", position: "relative" }} /></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSummaryView;

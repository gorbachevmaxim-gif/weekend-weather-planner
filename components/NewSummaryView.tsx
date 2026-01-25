import React, { useState, useMemo, useEffect } from "react";
import { CityAnalysisResult } from "../types";
import { useSummaryFiltering } from "../hooks/useSummaryFiltering";
import ArrowDown from "./icons/ArrowDown";
import ArrowUp from "./icons/ArrowUp";
import RoutesIcon from "./icons/RoutesIcon";
import GstrdnmcLogo from "./icons/GstrdnmcLogo";
import LightThemeIcon from "./icons/LightThemeIcon";
import DarkThemeIcon from "./icons/DarkThemeIcon";

interface NewSummaryViewProps {
  data: CityAnalysisResult[];
  onCityClick: (city: string, day: string) => void;
  onCityClickW2: (city: string, day: string) => void;
}

const NewSummaryView: React.FC<NewSummaryViewProps> = ({ data, onCityClick, onCityClickW2 }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isManifestoVisible, setIsManifestoVisible] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsManifestoVisible(false);
      }
    };
    if (isManifestoVisible) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isManifestoVisible]);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const { sunnyCities: sunnyCitiesW1 } = useSummaryFiltering({ data, isSecondWeekend: false });
  const { sunnyCities: sunnyCitiesW2 } = useSummaryFiltering({ data, isSecondWeekend: true });

  const allCities = useMemo(() => data.map(city => city.cityName), [data]);

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

  return (
    <div className="mt-[18px]">
      <div 
        className={`fixed inset-0 z-[100] transform transition-transform duration-500 ease-in-out overflow-y-auto ${isManifestoVisible ? 'translate-y-0' : '-translate-y-full'} ${isDark ? "bg-[#1E1E1E] text-white" : "bg-[#F5F5F5] text-black"}`}
      >
        <div className="w-[90%] md:max-w-[50%] mx-auto px-4">
            <div className={`sticky top-0 pt-[18px] pb-8 z-10 transition-colors duration-300 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                <button
                    onClick={() => setIsManifestoVisible(false)}
                    className={`flex items-baseline text-[14px] font-inter gap-0.5 ${isDark ? "text-white hover:text-[#777777]" : "text-black hover:text-[#777777]"}`}
                >
                    <span className="underline decoration-1 underline-offset-4">Закрыть</span>
                    <span className="hidden md:inline"> (esc)</span>
                    <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(45deg)", position: "relative", top: "7px", left: "-2px" }} />
                </button>
            </div>
            
            <div className={`mt-4 px-0 text-sm leading-relaxed text-left ${isDark ? "text-white" : "text-[#333333]"}`}>
                <div className="mb-6">
                <p>
                    Многие спрашивают, как можно присоединиться к Гастродинамике? Здесь мы описали что нужно делать, чтобы быть внутри нашего комьюнити.
                </p>
                </div>
                <div className="flex flex-col gap-y-4 pb-12">
                <p>
                    <span className="font-bold">1.</span> Быть вовлеченным в нашу общую жизнь, помогать с организацией туров, не стесняться, проявлять инициативу. У каждого из нас есть свои сильные стороны, профессиональные навыки, связи в обществе и многое другое, что можно отдать ребятам в комьюнити. Подумайте что можете сделать именно вы.
                </p>
                <p>
                    <span className="font-bold">2.</span> Быть сильным во время заездов, не жаловаться, рассчитывать свои силы и поддерживать друг друга.
                </p>
                <p>
                    <span className="font-bold">3.</span> Можно ли быть слабым для больших райдов, но быть в сообществе? Конечно, да! Главное, быть воспитанным, отдавать в комьюнити больше, чем забирать, регулярно тренироваться, если необходимо, прогрессировать и присоединяться к заездам по готовности.
                </p>
                <p>
                    <span className="font-bold">4.</span> Проявлять интерес к еде и к людям, кто её создает. Вы можете не знать чем отличается итальянский трюфель от французского, или же фамилии всех шефов сибирских ресторанов, но нам хочется, чтобы каждый развивал свои вкусы и помогал бы находить новые направления для туров через интересную локальную гастрономию.
                </p>
                <p>
                    <span className="font-bold">5.</span> Следить за питанием, общим состоянием здоровья, не забывать о витаминах. Мы искренне проповедуем максимальную эффективность как во время туров, так и за их пределами, поэтому хотим, чтобы каждый внутри комьюнити ответственно подходил к тому, что он ест, какой образ жизни ведет, как восстанавливается после физических нагрузок.
                </p>
                <p>
                    <span className="font-bold">6.</span> Заботиться о своем велосипеде, делать регулярное обслуживание, располагать расходниками к нему и важными запчастями (особенно в турах, вдалеке от дома). Ни для кого из нас не в кайф вместо классного заезда в хорошей компании, ждать кого-либо на обочине по причине безответственного подхода к своей технике. Проявляйте такую же заботу к велосипеду, как и к самому себе.
                </p>
                <p>
                    <span className="font-bold">7.</span> Управлять ожиданиями в комьюнити, чтобы ни у кого не было недопониманий. Сразу спрашивать, если что-то непонятно, и не молчать, когда видите, что чего-то не хватает. Делать шаг вперед, если есть идея с чем можете всем помочь, но не знаете с чего начать. Говорить заранее, если с чем-то не согласны, а критикуя что-то — всегда предлагать свой вариант. И главное, беря ответственность за что-либо — быть прозрачным, доводить дело до конца или вовремя делегировать на другого участника.
                </p>
                <p>
                    <span className="font-bold">8.</span> Если по каким-то причинам решили не быть частью комьюнити, то это нормально — сообщите всем об этом, поблагодарим друг друга за опыт, обнимемся и будем спокойно жить дальше.
                </p>
                </div>
            </div>
        </div>
      </div>

      <div className="px-4 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button
                onClick={() => setIsManifestoVisible(true)}
                className={`flex items-center text-[14px] font-inter hover:text-[#777777] gap-0.5 ${isDark ? "text-white" : "text-black"}`}
            >
                <span className="underline decoration-1 underline-offset-4">Манифест</span>
                <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(135deg)", position: "relative", top: "1px", left: "-2px" }} />
            </button>
            <button className="flex items-center mt-[3px]" onClick={toggleTheme}>
                {theme === 'light' ? <LightThemeIcon width="60" /> : <DarkThemeIcon width="60" />}
            </button>
        </div>
        <GstrdnmcLogo height="50" style={{ width: 'auto' }} fill={isDark ? "#FFFFFF" : "#111111"} />
      </div>
      <div className="mt-0 space-y-1">
        {sections.map((section) => {
          const isOpen = openSection === section.key;
          const isActive = isOpen;
          const isInactive = openSection !== null && !isOpen;
          
          let textColorClass = "";
          if (isDark) {
            if (isActive) textColorClass = "text-white md:hover:text-[#777777]";
            else if (isInactive) textColorClass = "text-[#383838] hover:text-[#777777]";
            else textColorClass = "text-white hover:text-[#777777]";
          } else {
            if (isActive) textColorClass = "text-[#333333] md:hover:text-[#777777]";
            else if (isInactive) textColorClass = "text-[#B2B2B2] hover:text-[#777777]";
            else textColorClass = "text-[#333333] hover:text-[#777777]";
          }

          return (
            <div key={section.key}>
              <button
                className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${textColorClass}`}
                onClick={() => toggleSection(section.key)}
              >
                <span className="flex items-center">{section.label}<ArrowDown isOpen={isOpen} width="20" height="20" style={{ top: "-7px" }} /></span>
              </button>
              {isOpen && (
                <div className="mt-0 px-4 space-y-0">
                  {section.w1Cities.length > 0 && (
                    <div className="flex flex-wrap gap-0">
                      <div className="bg-[#333333] text-[#F3F3F3] text-[13px] tracking-tighter rounded-full px-4 py-2">Эти выходные</div>
                      {section.w1Cities.map((city: CityAnalysisResult) => (
                        <button
                          key={city.cityName}
                          className={`text-black text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors ${isDark ? "bg-[#777777] hover:bg-white" : "bg-white hover:bg-pill-hover"}`}
                          onClick={() => onCityClick(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
                        >
                          {city.cityName}
                        </button>
                      ))}
                    </div>
                  )}
                  {section.w2Cities.length > 0 ? (
                    <div className="flex flex-wrap gap-0">
                      <div className="bg-[#333333] text-[#F3F3F3] text-[13px] tracking-tighter rounded-full px-4 py-2">Через неделю</div>
                      {section.w2Cities.map((city: CityAnalysisResult) => (
                        <button
                          key={city.cityName}
                          className={`text-black text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors ${isDark ? "bg-[#777777] hover:bg-white" : "bg-white hover:bg-pill-hover"}`}
                          onClick={() => onCityClickW2(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
                        >
                          {city.cityName}
                        </button>
                      ))}
                    </div>
                  ) : section.key === 'saturday' ? (
                    <div className="flex flex-wrap gap-0">
                      <div className="bg-[#333333] text-[#F3F3F3] text-[13px] tracking-tighter rounded-full px-4 py-2">Через неделю</div>
                      <div className={`text-black text-[13px] tracking-tighter rounded-full px-4 py-2 ${isDark ? "bg-[#777777]" : "bg-white"}`}>Везде осадки</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
        <div>
          <button
            className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
                isDark 
                ? (openSection === "cities" ? "text-white md:hover:text-[#777777]" : (openSection === null ? "text-white hover:text-[#777777]" : "text-[#383838] hover:text-[#777777]"))
                : (openSection === "cities" ? "text-[#333333] md:hover:text-[#777777]" : (openSection === null ? "text-[#333333] hover:text-[#777777]" : "text-[#B2B2B2] hover:text-[#777777]"))
            }`}
            onClick={() => toggleSection("cities")}
          >
            <span className="flex items-center">Города<ArrowDown isOpen={openSection === "cities"} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          {openSection === "cities" && (
            <div className="mt-0 flex flex-wrap gap-0 pl-4">
                  {allCities.map((city: string) => (
                <button
                  key={city}
                  className={`text-black text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors ${isDark ? "bg-[#777777] hover:bg-white" : "bg-white hover:bg-pill-hover"}`}
                  onClick={() => onCityClick(city, "saturday")}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <a
            href="https://www.komoot.com/collection/2674102/-lechappe-belle?ref=collection"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left px-4 py-px hover:text-[#777777] ${
              isDark
              ? (openSection !== null ? 'text-[#383838]' : 'text-white')
              : (openSection !== null ? 'text-[#B2B2B2]' : 'text-[#333333]')
            }`}            
          >
            <span className="flex items-center">Маршруты<RoutesIcon width="19" height="19" style={{ top: "-7px" }} /></span>
          </a>
        </div>
        <div>
          <a
            href="https://spotty-knee-d45.notion.site/2b4539890ee28104bc8aed31be5878f8?v=2b4539890ee281018d17000c41107ec0&source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left px-4 py-px hover:text-[#777777] ${
              isDark
              ? (openSection !== null ? 'text-[#383838]' : 'text-white')
              : (openSection !== null ? 'text-[#B2B2B2]' : 'text-[#333333]')
            }`}            
          >
            <span className="flex items-center">Календарь<RoutesIcon width="19" height="19" style={{ top: "-7px" }} /></span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewSummaryView;

import React, { useState, useMemo, useEffect } from "react";
import { CityAnalysisResult } from "../types";
import { useSummaryFiltering } from "../hooks/useSummaryFiltering";
import ArrowDown from "./icons/ArrowDown";
import ArrowUp from "./icons/ArrowUp";
import RoutesIcon from "./icons/RoutesIcon";
import GstrdnmcLogo from "./icons/GstrdnmcLogo";
import LightThemeIcon from "./icons/LightThemeIcon";
import DarkThemeIcon from "./icons/DarkThemeIcon";
import GeeseIcon from "./icons/GeeseIcon";

// Helper component for smooth accordion animation
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
}

const NewSummaryView: React.FC<NewSummaryViewProps> = ({ data, onCityClick, onCityClickW2 }) => {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [activeOverlay, setActiveOverlay] = useState<'manifesto' | 'rules' | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
  });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
        setActiveOverlay(null);
      }
    };
    if (activeOverlay) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [activeOverlay]);

  const toggleSection = (section: string) => {
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
    // Sort by sun descending (most sunny first)
    sorted.sort((a, b) => {
      const getSun = (city: CityAnalysisResult) => {
        let total = 0;
        total += city.weekend1.saturday?.sunSeconds || 0;
        total += city.weekend1.sunday?.sunSeconds || 0;
        total += city.weekend2.saturday?.sunSeconds || 0;
        total += city.weekend2.sunday?.sunSeconds || 0;
        return total;
      };
      
      const sunDiff = getSun(b) - getSun(a);
      // Tie-breaker: Alphabetical
      if (sunDiff === 0) {
        return a.cityName.localeCompare(b.cityName);
      }
      return sunDiff;
    });
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

  return (
    <div className="mt-[18px]">
      <div 
        className={`fixed inset-0 z-[100] transform transition-transform duration-500 ease-in-out overflow-y-auto ${activeOverlay ? 'translate-y-0' : '-translate-y-full'} ${isDark ? "bg-[#1E1E1E] text-white" : "bg-[#F5F5F5] text-black"}`}
      >
        <div className="w-[90%] md:max-w-[50%] mx-auto px-4">
            <div className={`sticky top-0 pt-[18px] pb-8 z-10 transition-colors duration-300 ${isDark ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                <button
                    onClick={() => setActiveOverlay(null)}
                    className={`flex items-baseline text-[14px] font-inter gap-0.5 ${isDark ? "text-[#777777] hover:text-[#aaaaaa]" : "text-black hover:text-[#777777]"}`}
                >
                    <span className="underline decoration-1 underline-offset-4">Прочитано</span>
                    <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(45deg)", position: "relative", top: "7px", left: "-2px" }} />
                    <span className="hidden md:inline"> </span>
                </button>
            </div>
            
            <div className={`mt-4 px-0 text-sm leading-relaxed text-left ${isDark ? "text-[#aaaaaa]" : "text-[#333333]"}`}>
                {activeOverlay === 'manifesto' && (
                    <>
                        <div className="mb-6">
                            <p>
                                Многие спрашивают, как можно присоединиться к Гастродинамике. Здесь мы описали что нужно делать, чтобы быть внутри комьюнити.
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
                            <div className="pt-12 flex justify-center">
                                <GeeseIcon className={`w-2/3 h-auto ${isDark ? "text-[#666666]" : ""}`} />
                            </div>
                        </div>
                    </>
                )}
                {activeOverlay === 'rules' && (
                    <>
                        <div className="mb-6">
                            <p>
                                Мы едем не просто кататься, мы едем вместе. Чтобы райд прошел безопасно и в кайф, мы договариваемся о правилах «на берегу».
                            </p>
                        </div>
                        <div className="flex flex-col gap-y-4 pb-12">
                            <div>
                                <p className="font-bold text-base mb-2">1. Я – не пассажир, я – пилот.</p>
                                <p>Организаторы обеспечивают логистику, маршрут и сопровождение. Но они не няньки.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><span className="font-bold">Техника.</span> Я гарантирую исправность своего велосипеда, чистоту цепи и надежность тормозов. Навык самостоятельной замены камеры (покрышки) – обязателен.</li>
                                    <li><span className="font-bold">Специфика маршрута.</span> Я понимаю, что любой райд требует подготовки «железа».
                                        <ul className="list-disc pl-5 mt-1">
                                            <li><span className="font-bold">Покрышки:</span> Подбор резины соответствует покрытию. Это мой залог зацепа и безопасности на спусках и поворотах.</li>
                                            <li><span className="font-bold">Трансмиссия:</span> Моя кассета подходит для рельефа. Я здесь, чтобы крутить педали и любоваться пейзажем, а не ломать колени на слишком тяжелых передачах.</li>
                                        </ul>
                                    </li>
                                    <li><span className="font-bold">Экипировка.</span> У меня в наличии: шлем (обязательно!), ремкомплект, запаска (камера или покрышка), насос и свет. Отсутствие чего-либо из списка – это моя личная ответственность, которую я решаю без задержки группы.</li>
                                    <li><span className="font-bold">Тело.</span> У меня адекватная оценка своей физподготовки и полная уверенность в том, что заявленный километраж мне по силам.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-base mb-2">2. Дисциплина – это вежливость.</p>
                                <p>Семеро одного не ждут.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><span className="font-bold">Старт.</span> Если сбор назначен на 8:00, в 8:00 мы уже в движении.</li>
                                    <li><span className="font-bold">Опоздания.</span> В случае моего опоздания группа уезжает. Догонять придется самостоятельно и за свой счет (такси или своим ходом).</li>
                                    <li><span className="font-bold">Брифинги.</span> Я внимательно слушаю брифинги и читаю чат. Вопросы о том, что уже было озвучено или написано – это неуважение к времени организаторов.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-base mb-2">3. Режим и Безопасность.</p>
                                <p>Мы здесь ради спорта и эмоций, а не ради угара.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><span className="font-bold">Алкоголь.</span> Сухой закон действует с момента пробуждения и до финиша райда. Вечером – умеренное потребление, чтобы утром быть в отличной форме. Если из-за самочувствия я не могу ехать в общем темпе – см. пункт про «Опоздания».</li>
                                    <li><span className="font-bold">Правила движения.</span> Мы едем по дорогам общего пользования. Я знаю и уважаю ПДД, следую только командам ведущих группу.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-base mb-2">4. Кодекс.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li><span className="font-bold">В группе</span> – мы уважаем темп друг друга. «Лоси» не дергают группу, «туристы» не лезут вперед. Желание ехать быстрее или медленнее – это мой выбор: я предупреждаю и еду соло, снимая ответственность с группы.</li>
                                    <li><span className="font-bold">Поддержка</span> – если райдер пробил колесо или упал, мы останавливаемся и помогаем. Но если кто-то просто не тянет темп из-за отсутствия подготовки, то садится в машину сопровождения, чтобы не задерживать пелотон (см. п.1). Своих не бросаем, но и не тащим.</li>
                                    <li><span className="font-bold">Гендер</span> – в смешанных группах мы соблюдаем культуру джентльменства. Мы не «дропаем» девушек на сложных участках, если едем в одной пачке.</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-base mb-2">5. Отношение к организаторам.</p>
                                <p>Организаторы – это гиды вашего приключения, а не обслуживающий персонал.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Мы общаемся на равных и с уважением.</li>
                                    <li>Любая помощь организаторам приветствуется и повышает карму (резерв ресторанов, организация трансфера и машины сопровождения).</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="px-4 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button
                onClick={() => setActiveOverlay('manifesto')}
                className={`flex items-center text-[14px] font-inter hover:text-[#777777] gap-0.5 ${isDark ? "text-white" : "text-black"}`}
            >
                <span className="underline decoration-1 underline-offset-4">Комьюнити</span>
                <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(135deg)", position: "relative", top: "1px", left: "-2px" }} />
            </button>
            <button
                onClick={() => setActiveOverlay('rules')}
                className={`flex items-center text-[14px] font-inter hover:text-[#777777] gap-0.5 ${isDark ? "text-white" : "text-black"}`}
            >
                <span className="underline decoration-1 underline-offset-4">Правила</span>
                <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(135deg)", position: "relative", top: "1px", left: "-2px" }} />
            </button>
            <button className="flex items-center mt-[3px]" onClick={toggleTheme}>
                {theme === 'light' ? <LightThemeIcon width="60" /> : <DarkThemeIcon width="60" />}
            </button>
        </div>
        
      </div>
      <div className="mt-0 space-y-1">
        {sections.map((section, index) => {
          const isOpen = openSections.includes(section.key);
          const isActive = isOpen;
          const isInactive = openSections.length > 0 && !isOpen;
          
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
            <div 
                key={section.key}
                className={`transition-all duration-500 ease-out transform ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
            >
              <button
                className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${textColorClass}`}
                onClick={() => toggleSection(section.key)}
              >
                <span className="flex items-center">{section.label}<ArrowDown isOpen={isOpen} width="20" height="20" style={{ top: "-7px" }} /></span>
              </button>
              <AccordionContent isOpen={isOpen}>
                <div className="mt-0 px-4 space-y-[8px]">
                  {section.w1Cities.length > 0 && (
                    <div className="flex flex-wrap gap-0">
                      <div className={`${isDark ? "bg-[#777777] text-[#000000]" : "bg-[#333333] text-[#F3F3F3]"} text-[13px] tracking-tighter rounded-full px-4 py-2`}>Эти выходные</div>
                      {section.w1Cities.map((city: CityAnalysisResult) => (
                        <button
                          key={city.cityName}
                          className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors ${isDark ? "bg-[#333333] text-white hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                          onClick={() => onCityClick(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
                        >
                          {city.cityName}
                        </button>
                      ))}
                    </div>
                  )}
                  {section.w2Cities.length > 0 ? (
                    <div className="flex flex-wrap gap-0">
                      <div className={`${isDark ? "bg-[#777777] text-[#000000]" : "bg-[#333333] text-[#F3F3F3]"} text-[13px] tracking-tighter rounded-full px-4 py-2`}>Через неделю</div>
                      {section.w2Cities.map((city: CityAnalysisResult) => (
                        <button
                          key={city.cityName}
                          className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors ${isDark ? "bg-[#333333] text-white hover:bg-[#444444]" : "bg-white text-black hover:bg-pill-hover"}`}
                          onClick={() => onCityClickW2(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
                        >
                          {city.cityName}
                        </button>
                      ))}
                    </div>
                  ) : section.key === 'saturday' ? (
                    <div className="flex flex-wrap gap-0">
                      <div className={`${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#333333] text-[#F3F3F3]"} text-[13px] tracking-tighter rounded-full px-4 py-2`}>Через неделю</div>
                      <div className={`text-black text-[13px] tracking-tighter rounded-full px-4 py-2 ${isDark ? "bg-[#777777]" : "bg-white"}`}>Везде осадки</div>
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
            className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
                isDark 
                ? (openSections.includes("cities") ? "text-white md:hover:text-[#777777]" : (openSections.length === 0 ? "text-white hover:text-[#777777]" : "text-[#383838] hover:text-[#777777]"))
                : (openSections.includes("cities") ? "text-[#333333] md:hover:text-[#777777]" : (openSections.length === 0 ? "text-[#333333] hover:text-[#777777]" : "text-[#B2B2B2] hover:text-[#777777]"))
            }`}
            onClick={() => toggleSection("cities")}
          >
            <span className="flex items-center">Города<ArrowDown isOpen={openSections.includes("cities")} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          <AccordionContent isOpen={openSections.includes("cities")}>
            <div className="mt-0 flex flex-wrap gap-0 pl-4">
                  {sortedCities.map((city: string) => (
                <button
                  key={city}
                  className={`text-[13px] tracking-tighter rounded-full px-4 py-2 transition-colors ${isDark ? "bg-[#333333] text-white hover:bg-[#555555]" : "bg-white text-black hover:bg-pill-hover"}`}
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
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left px-4 py-px hover:text-[#777777] ${
              isDark
              ? (openSections.length > 0 ? 'text-[#383838]' : 'text-white')
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
          <a
            href="https://spotty-knee-d45.notion.site/2b4539890ee28104bc8aed31be5878f8?v=2b4539890ee281018d17000c41107ec0&source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left px-4 py-px hover:text-[#777777] ${
              isDark
              ? (openSections.length > 0 ? 'text-[#383838]' : 'text-white')
              : (openSections.length > 0 ? 'text-[#B2B2B2]' : 'text-[#333333]')
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

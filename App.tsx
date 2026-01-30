import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { CITIES } from "./constants";
import { CityAnalysisResult, LoadingState } from "./types";
import { analyzeCity, getWeekendDates, MOUNTAIN_CITIES } from "./services/weatherService";
import LoadingScreen from "./components/LoadingScreen";
import NewSummaryView from "./components/NewSummaryView";
import CityDetail from "./components/CityDetail";
import ArrowUp from "./components/icons/ArrowUp";
import LightThemeIcon from "./components/icons/LightThemeIcon";
import DarkThemeIcon from "./components/icons/DarkThemeIcon";
import GeeseIcon from "./components/icons/GeeseIcon";

const App: React.FC = () => {
  const [data, setData] = useState<CityAnalysisResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ total: 0, current: 0, status: "Starting..." });
  const [showLoading, setShowLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<"w1" | "w2">("w1");
  const [initialDay, setInitialDay] = useState<string>("saturday");
  
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 1200);
  const [isSliderOpen, setIsSliderOpen] = useState<boolean>(false);
  const [activeOverlay, setActiveOverlay] = useState<'manifesto' | 'rules' | null>(null);
  
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const dates = useMemo(() => getWeekendDates(), []);

  useEffect(() => {
    const handleResize = () => {
        setIsDesktop(window.innerWidth >= 1200);
    };
    window.addEventListener('resize', handleResize);
    
    // Check initial theme from DOM or system
    if (document.documentElement.classList.contains("dark-theme")) {
        setTheme("dark");
    }

    return () => window.removeEventListener('resize', handleResize);
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
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
              if (activeOverlay) {
                  setActiveOverlay(null);
              } else {
                  setIsSliderOpen(prev => !prev);
              }
          }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeOverlay]);

  useEffect(() => {
    const fetchData = async () => {
      const cityNames = Object.keys(CITIES).sort();
      const results: CityAnalysisResult[] = [];
      const total = cityNames.length;

      setLoading({ total, current: 0, status: "Загрузка списка..." });

      const BATCH_SIZE = 10;
      
      for (let i = 0; i < total; i += BATCH_SIZE) {
         if (i > 0) await new Promise(resolve => setTimeout(resolve, 50));

         const batch = cityNames.slice(i, i + BATCH_SIZE);
         const promises = batch.map(name => {
             setLoading(prev => ({ ...prev, current: prev.current, status: `Анализ: ${name}` }));
             return analyzeCity(name, CITIES[name], dates);
         });

         const batchResults = await Promise.all(promises);
         batchResults.forEach(res => {
             if (res) results.push(res);
         });
         
         setLoading(prev => ({ ...prev, current: Math.min(total, i + batch.length) }));
      }

      setData(results);
      setLoading(prev => ({ ...prev, current: total, status: "Готово" }));
    };

    const fetchDataAndHandleErrors = async () => {
      try {
        await fetchData();
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "An unknown error occurred while fetching data.");
        setShowLoading(false);
      }
    };
    fetchDataAndHandleErrors();
  }, [dates]);

  // Auto-select logic for desktop
  useEffect(() => {
      if (isDesktop && !selectedCity && data.length > 0 && !showLoading) {
          const timeSlots: { tab: "w1" | "w2", day: string, getter: (c: CityAnalysisResult) => any }[] = [
              { tab: "w1", day: "saturday", getter: c => c.weekend1.saturday },
              { tab: "w1", day: "sunday", getter: c => c.weekend1.sunday },
              { tab: "w2", day: "saturday", getter: c => c.weekend2.saturday },
              { tab: "w2", day: "sunday", getter: c => c.weekend2.sunday }
          ];

          let found = false;

          for (const slot of timeSlots) {
              const candidates = data.filter(city => {
                  const stats = slot.getter(city);
                  // Ensure we use the exact same logic as visual list: isRideable + not mountain
                  return stats && stats.isRideable && !MOUNTAIN_CITIES.includes(city.cityName);
              });

              if (candidates.length > 0) {
                  // Sort by sun descending, then alphabetical
                  candidates.sort((a, b) => {
                      const sunA = slot.getter(a)?.sunSeconds || 0;
                      const sunB = slot.getter(b)?.sunSeconds || 0;
                      if (sunB !== sunA) return sunB - sunA;
                      return a.cityName.localeCompare(b.cityName);
                  });

                  const winner = candidates[0];
                  setInitialTab(slot.tab);
                  setSelectedCity(winner.cityName);
                  setInitialDay(slot.day);
                  found = true;
                  break;
              }
          }

          if (!found) {
              // Fallback: First alphabetical non-mountain city
              const fallbackCandidates = data.filter(c => !MOUNTAIN_CITIES.includes(c.cityName));
              fallbackCandidates.sort((a, b) => a.cityName.localeCompare(b.cityName));

              if (fallbackCandidates.length > 0) {
                  const first = fallbackCandidates[0];
                  setInitialTab("w1");
                  setSelectedCity(first.cityName);
                  setInitialDay("saturday");
              } else if (data.length > 0) {
                  // Absolute fallback
                  const first = data[0];
                  setInitialTab("w1");
                  setSelectedCity(first.cityName);
                  setInitialDay("saturday");
              }
          }
      }
  }, [isDesktop, data, selectedCity, showLoading]);

  const selectedData = useMemo(() => {
      if (!selectedCity) return null;
      return data.find(c => c.cityName === selectedCity) || null;
  }, [data, selectedCity]);

  const handleCitySelect = (city: string, tab: "w1" | "w2", day: string) => {
      setInitialTab(tab);
      setSelectedCity(city);
      setInitialDay(day);
      if (isDesktop) {
          setIsSliderOpen(false);
      }
  };

    if (showLoading) {
            return <LoadingScreen state={loading} onComplete={() => setShowLoading(false)} />;
    }

    if (isDesktop) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? "bg-[#1E1E1E] text-white" : "bg-[#F5F5F5] text-black"} relative`}>
                {/* Slider */}
                <div 
                    className={`fixed top-0 left-0 h-full w-[500px] z-50 ${theme === 'dark' ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} shadow-2xl transform transition-transform duration-300 ease-in-out ${isSliderOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className={`fixed inset-0 z-[100] transform transition-transform duration-500 ease-in-out overflow-y-auto ${activeOverlay ? 'translate-y-0' : '-translate-y-full'} ${theme === 'dark' ? "bg-[#1E1E1E] text-white" : "bg-[#F5F5F5] text-black"}`}>
                        <div className="w-[90%] md:max-w-[50%] mx-auto px-4">
                            <div className={`sticky top-0 pt-[18px] pb-8 z-10 transition-colors duration-300 ${theme === 'dark' ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"}`}>
                                <button
                                    onClick={() => setActiveOverlay(null)}
                                    className={`flex items-baseline text-[14px] font-inter gap-0.5 ${theme === 'dark' ? "text-[#777777] hover:text-[#aaaaaa]" : "text-black hover:text-[#777777]"}`}
                                >
                                    <span className="underline decoration-1 underline-offset-4">Прочитано</span>
                                    <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(45deg)", position: "relative", top: "7px", left: "-2px" }} />
                                    <span className="hidden md:inline"> </span>
                                </button>
                            </div>
                            
                            <div className={`mt-4 px-0 text-sm leading-relaxed text-left ${theme === 'dark' ? "text-[#aaaaaa]" : "text-[#333333]"}`}>
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
                                                <GeeseIcon className={`w-2/3 h-auto ${theme === 'dark' ? "text-[#666666]" : ""}`} />
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

                    <div className={`flex justify-start items-center gap-12 pt-[25px] pb-4 pr-16 pl-[53px]`}>
                        <button onClick={() => setIsSliderOpen(false)} className={`p-2 ${theme === 'dark' ? "text-white hover:text-gray-300" : "text-black hover:text-gray-500"}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveOverlay('manifesto')}
                                className={`flex items-center text-[14px] font-inter hover:text-[#777777] gap-0.5 ${theme === 'dark' ? "text-white" : "text-black"}`}
                            >
                                <span className="underline decoration-1 underline-offset-4">Комьюнити</span>
                                <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(135deg)", position: "relative", top: "1px", left: "-2px" }} />
                            </button>
                            <button
                                onClick={() => setActiveOverlay('rules')}
                                className={`flex items-center text-[14px] font-inter hover:text-[#777777] gap-0.5 ${theme === 'dark' ? "text-white" : "text-black"}`}
                            >
                                <span className="underline decoration-1 underline-offset-4">Правила</span>
                                <ArrowUp width="22" height="22" strokeWidth="1" style={{ transform: "rotate(135deg)", position: "relative", top: "1px", left: "-2px" }} />
                            </button>
                            <button className="flex items-center mt-[3px]" onClick={toggleTheme}>
                                {theme === 'light' ? <LightThemeIcon width="60" /> : <DarkThemeIcon width="60" />}
                            </button>
                        </div>
                    </div>
                    <div className="h-[calc(100%-60px)] overflow-y-auto pb-10">
                        <NewSummaryView 
                            data={data} 
                            onCityClick={(city, day) => handleCitySelect(city, "w1", day)}
                            onCityClickW2={(city, day) => handleCitySelect(city, "w2", day)}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            contentPadding="pl-16 pr-16"
                        />
                    </div>
                </div>
                
                {/* Overlay */}
                <div 
                    className={`fixed inset-0 ${theme === 'dark' ? "bg-black" : "bg-[#333333]"} z-40 transition-opacity duration-300 ease-in-out pointer-events-none ${isSliderOpen ? (theme === 'dark' ? 'opacity-80 pointer-events-auto' : 'opacity-70 pointer-events-auto') : 'opacity-0'}`}
                    onClick={() => setIsSliderOpen(false)}
                />

                {/* Main Content */}
                <div className="w-[1440px] mx-auto pt-6 px-12 relative z-10 box-border">
                    {selectedData && (
                        <CityDetail 
                            data={selectedData} 
                            initialTab={initialTab}
                            initialDay={initialDay}
                            onClose={() => {}} 
                            isDesktop={true}
                            onToggleSlider={() => setIsSliderOpen(true)}
                            isDark={theme === 'dark'}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-10 flex flex-col app-mobile-width">
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-auto max-w-2xl mt-4" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-6 flex-grow flex flex-col w-full">
        
        {!selectedCity ? (
            <NewSummaryView 
                data={data} 
                onCityClick={(city, day) => handleCitySelect(city, "w1", day)}
                onCityClickW2={(city, day) => handleCitySelect(city, "w2", day)}
                theme={theme}
                toggleTheme={toggleTheme}
            />
        ) : (
            selectedData && (
                <CityDetail 
                    data={selectedData} 
                    initialTab={initialTab}
                    initialDay={initialDay}
                    onClose={() => setSelectedCity(null)} 
                    isDark={theme === 'dark'}
                />
            )
        )}
      </div>
    </div>
  );
};

export default App;

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { CITIES } from "./config/constants";
import { CityAnalysisResult, LoadingState } from "./types";
import { analyzeCity, getWeekendDates } from "./services/weatherService";
import { MOUNTAIN_CITIES } from "./config/constants";
import LoadingScreen from "./components/LoadingScreen";
import NewSummaryView from "./components/NewSummaryView";
import CityDetail from "./components/CityDetail";
import ArrowUp from "./components/icons/ArrowUp";
import SquareLockIcon from "./components/icons/SquareLockIcon";
import ThemeToggleIcon from "./components/icons/ThemeToggleIcon";
import OverlayContent from "./components/OverlayContent";
import AuthScreen from "./components/AuthScreen";
import OrientationBlocker from "./components/OrientationBlocker";
import { isAuthenticated, logout } from "./utils/auth";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [data, setData] = useState<CityAnalysisResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ total: 0, current: 0, status: "Starting..." });
  const [showLoading, setShowLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<"w1" | "w2">("w1");
  const [initialDay, setInitialDay] = useState<string>("saturday");
  
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 1200);
  const [isSliderOpen, setIsSliderOpen] = useState<boolean>(false);
  const [activeOverlay, setActiveOverlay] = useState<'manifesto' | 'rules' | 'velominati' | null>(null);
  const lastActiveOverlayRef = useRef<'manifesto' | 'rules' | 'velominati' | null>(null);

  useEffect(() => {
    if (activeOverlay) {
        lastActiveOverlayRef.current = activeOverlay;
    }
  }, [activeOverlay]);
  
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const dates = useMemo(() => getWeekendDates(), [refreshTrigger]);
  const lastFetchTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleRevalidation = () => {
        const now = Date.now();
        const fourHours = 4 * 60 * 60 * 1000;
        if (now - lastFetchTimeRef.current > fourHours) {
            console.log("Revalidating data...");
            setRefreshTrigger(prev => prev + 1);
        }
    };

    window.addEventListener('focus', handleRevalidation);
    window.addEventListener('online', handleRevalidation);
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            handleRevalidation();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        window.removeEventListener('focus', handleRevalidation);
        window.removeEventListener('online', handleRevalidation);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  const handleLogout = () => {
      logout();
      setIsAuth(false);
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
    if (!isAuth) return;

    const fetchData = async () => {
      const cityNames = Object.keys(CITIES).sort();
      const results: CityAnalysisResult[] = [];
      const total = cityNames.length;

      setLoading({ total, current: 0, status: "Загрузка списка..." });

      const BATCH_SIZE = 10;
      
      // First pass - try to fetch all cities
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

      // Second pass - retry failed cities (those that returned null)
      const successfulCityNames = new Set(results.map(r => r.cityName));
      const failedCities = cityNames.filter(name => !successfulCityNames.has(name));
      
      if (failedCities.length > 0) {
        console.log(`Retrying ${failedCities.length} failed cities:`, failedCities);
        setLoading(prev => ({ ...prev, status: "Повторная попытка для неудачных городов..." }));
        
        for (let i = 0; i < failedCities.length; i += BATCH_SIZE) {
            const batch = failedCities.slice(i, i + BATCH_SIZE);
            const promises = batch.map(name => {
                setLoading(prev => ({ ...prev, current: prev.current, status: `Повтор: ${name}` }));
                return analyzeCity(name, CITIES[name], dates);
            });

            const batchResults = await Promise.all(promises);
            batchResults.forEach(res => {
                if (res) results.push(res);
            });
            
            setLoading(prev => ({ ...prev, current: Math.min(total, total - failedCities.length + i + batch.length) }));
        }
      }

      setData(results);
      setLoading(prev => ({ ...prev, current: total, status: "Готово" }));
      lastFetchTimeRef.current = Date.now();
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
  }, [dates, isAuth]);

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
                  // Ensure we use the exact same logic as visual list: isRideable + hasRoute + not mountain
                  return stats && stats.isRideable && stats.hasRoute && !MOUNTAIN_CITIES.includes(city.cityName);
              });

              if (candidates.length > 0) {
                  // Sort by sun descending, then alphabetical
                  // If sun difference is small (less than 1 hour), prefer alphabetical to avoid jumping around similar cities
                  candidates.sort((a, b) => {
                      const sunA = slot.getter(a)?.sunSeconds || 0;
                      const sunB = slot.getter(b)?.sunSeconds || 0;
                      
                      const diff = sunB - sunA;
                      if (Math.abs(diff) > 3600) {
                          return diff;
                      }

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
              // Fallback: Best option for W1 Saturday (least rain, then most sun)
              const fallbackCandidates = data.filter(c => !MOUNTAIN_CITIES.includes(c.cityName));
              
              fallbackCandidates.sort((a, b) => {
                  const statA = a.weekend1.saturday;
                  const statB = b.weekend1.saturday;
                  
                  if (!statA || !statB) return 0;
                  
                  // 1. Least rain
                  if (Math.abs(statA.precipSum - statB.precipSum) > 0.1) {
                      return statA.precipSum - statB.precipSum;
                  }
                  
                  // 2. Most sun
                  if (statA.sunSeconds !== statB.sunSeconds) {
                      return statB.sunSeconds - statA.sunSeconds;
                  }

                  return a.cityName.localeCompare(b.cityName);
              });

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

    if (!isAuth) {
        return (
            <>
                <OrientationBlocker isDark={theme === 'dark'} />
                <AuthScreen onLogin={() => setIsAuth(true)} />
            </>
        );
    }

    if (showLoading) {
        return (
            <>
                <OrientationBlocker isDark={theme === 'dark'} />
                <LoadingScreen state={loading} onComplete={() => setShowLoading(false)} />
            </>
        );
    }

    if (isDesktop) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? "bg-[#111111] text-[#D9D9D9]" : "bg-[#F5F5F5] text-black"} relative transition-colors duration-700`}>
                <Analytics />
                <SpeedInsights />
                {/* Slider */}
                <div 
                    className={`fixed top-0 left-0 h-full w-[500px] z-50 ${theme === 'dark' ? "bg-[#111111]" : "bg-[#F5F5F5]"} shadow-2xl transform transition-transform duration-500 ease-in-out transition-colors duration-500 ${isSliderOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className={`absolute inset-0 z-[100] transform transition-transform duration-500 ease-in-out overflow-y-auto ${activeOverlay ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? "bg-[#111111] text-[#D9D9D9]" : "bg-[#F5F5F5] text-black"} transition-colors duration-700`}>
                        <div className="w-full px-16">
                            <div className={`sticky top-0 pt-[18px] pb-8 z-10 transition-colors duration-700 ${theme === 'dark' ? "bg-[#111111]" : "bg-[#F5F5F5]"}`}>
                                <button
                                    onClick={() => setActiveOverlay(null)}
                                    className={`group flex items-baseline text-[14px] font-inter gap-0.5 ${theme === 'dark' ? "text-[#777777] hover:text-[#aaaaaa]" : "text-black hover:text-[#777777]"}`}
                                >
                                    <span className="underline decoration-1 underline-offset-4">Прочитано</span>
                                    <ArrowUp width="22" height="22" strokeWidth="1" className="rotate-[45deg] group-hover:rotate-[-45deg] transition-transform duration-300" style={{ position: "relative", top: "7px", left: "-2px" }} />
                                    <span className="hidden md:inline"> </span>
                                </button>
                            </div>
                            
                            {activeOverlay && <OverlayContent activeOverlay={activeOverlay} theme={theme} />}
                        </div>
                    </div>

                    <div className={`flex justify-between items-center pt-[25px] pb-4 pr-[200px] pl-[53px]`}>
                        <button onClick={() => setIsSliderOpen(false)} className={`p-2 ${theme === 'dark' ? "text-[#D9D9D9] hover:text-gray-300" : "text-black hover:text-gray-500"}`}>
                            <svg className="translate-x-[4px]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <button className="flex items-center mt-[3px]" onClick={toggleTheme}>
                            <ThemeToggleIcon isDark={theme === 'dark'} width={60} height={31} />
                        </button>
                        <button onClick={handleLogout} className={`opacity-50 hover:opacity-100 ${theme === 'dark' ? "text-[#D9D9D9]" : "text-black"}`}>
                            <SquareLockIcon />
                        </button>
                    </div>
                    <div className="h-[calc(100%-60px)] overflow-y-auto pb-10">
                        <NewSummaryView 
                            data={data} 
                            onCityClick={(city, day) => handleCitySelect(city, "w1", day)}
                            onCityClickW2={(city, day) => handleCitySelect(city, "w2", day)}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            contentPadding="pl-16 pr-16"
                            isDesktop={true}
                            onCommunityClick={() => setActiveOverlay('manifesto')}
                            onRulesClick={() => setActiveOverlay('rules')}
                            onVelominatiClick={() => setActiveOverlay('velominati')}
                        />
                    </div>
                </div>
                
                {/* Overlay */}
                <div 
                    className={`fixed inset-0 ${theme === 'dark' ? "bg-black" : "bg-[#333333]"} z-40 transition-opacity duration-300 ease-in-out pointer-events-none transition-colors duration-700 ${isSliderOpen ? (theme === 'dark' ? 'opacity-80 pointer-events-auto' : 'opacity-70 pointer-events-auto') : 'opacity-0'}`}
                    onClick={() => setIsSliderOpen(false)}
                />

                {/* Main Content */}
                <div className="w-full max-w-[1440px] mx-auto pt-6 px-[3.5%] relative z-10 box-border">
                    {selectedData && (
                        <CityDetail 
                            key={selectedCity}
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
        <>
        <OrientationBlocker isDark={theme === 'dark'} />
        <div className={`min-h-dvh pb-10 flex flex-col app-mobile-width ${theme === 'dark' ? "bg-[#111111] text-[#D9D9D9]" : "bg-[#F5F5F5] text-black"} transition-colors duration-700`}>
      <Analytics />
      <SpeedInsights />
      
      <div 
        className={`fixed inset-0 z-50 overflow-y-auto transition-transform duration-500 ease-in-out ${theme === 'dark' ? "bg-[#111111] text-[#D9D9D9]" : "bg-[#F5F5F5] text-black"} transition-colors duration-700 ${activeOverlay ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {(activeOverlay || lastActiveOverlayRef.current) && (
            <div className="w-full px-4">
                 <div className={`sticky top-0 pt-[18px] pb-8 z-10 flex justify-between items-center ${theme === 'dark' ? "bg-[#111111]" : "bg-[#F5F5F5]"} transition-colors duration-700`}>
                    <button
                        onClick={() => setActiveOverlay(null)}
                        className={`group flex items-baseline text-[14px] font-inter gap-0.5 ${theme === 'dark' ? "text-[#777777] hover:text-[#aaaaaa]" : "text-black hover:text-[#777777]"}`}
                    >
                        <span className="underline decoration-1 underline-offset-4">Прочитано</span>
                        <ArrowUp width="22" height="22" strokeWidth="1" className="rotate-[45deg]" style={{ position: "relative", top: "7px", left: "-2px" }} />
                    </button>
                </div>
                <OverlayContent activeOverlay={(activeOverlay || lastActiveOverlayRef.current) as 'manifesto' | 'rules' | 'velominati'} theme={theme} />
            </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-auto max-w-2xl mt-4" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 space-y-6 flex-grow flex flex-col w-full">
        
        {!selectedCity ? (
            <>
                <div className="flex items-center justify-between pb-4 px-4 pr-20">
                    <button className="flex items-center mt-[3px]" onClick={toggleTheme}>
                        <ThemeToggleIcon isDark={theme === 'dark'} width={60} height={31} />
                    </button>
                    <button onClick={handleLogout} className={`opacity-50 hover:opacity-100 ${theme === 'dark' ? "text-[#D9D9D9]" : "text-black"}`}>
                        <SquareLockIcon />
                    </button>
                </div>
                <NewSummaryView 
                    data={data} 
                    onCityClick={(city, day) => handleCitySelect(city, "w1", day)}
                    onCityClickW2={(city, day) => handleCitySelect(city, "w2", day)}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    isDesktop={false}
                    onCommunityClick={() => setActiveOverlay('manifesto')}
                    onRulesClick={() => setActiveOverlay('rules')}
                    onVelominatiClick={() => setActiveOverlay('velominati')}
                />
            </>
        ) : (
            selectedData && (
                <CityDetail 
                    key={selectedCity}
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
    </>
  );
};

export default App;

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { CITIES } from "./constants";
import { CityAnalysisResult, LoadingState } from "./types";
import { analyzeCity, getWeekendDates, MOUNTAIN_CITIES } from "./services/weatherService";
import LoadingScreen from "./components/LoadingScreen";
import NewSummaryView from "./components/NewSummaryView";
import CityDetail from "./components/CityDetail";

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
                    className={`fixed top-0 left-0 h-full w-[550px] z-50 ${theme === 'dark' ? "bg-[#1E1E1E]" : "bg-[#F5F5F5]"} shadow-2xl transform transition-transform duration-300 ease-in-out ${isSliderOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className={`flex justify-start p-4 pl-16 border-b ${theme === 'dark' ? "border-[#333333]" : "border-[#D9D9D9]"}`}>
                        <button onClick={() => setIsSliderOpen(false)} className={`p-2 ${theme === 'dark' ? "text-white hover:text-gray-300" : "text-black hover:text-gray-500"}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div className="h-[calc(100%-60px)] overflow-y-auto pb-10">
                        <NewSummaryView 
                            data={data} 
                            onCityClick={(city, day) => handleCitySelect(city, "w1", day)}
                            onCityClickW2={(city, day) => handleCitySelect(city, "w2", day)}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            contentPadding="pl-16 pr-4"
                        />
                    </div>
                </div>
                
                {/* Overlay */}
                <div 
                    className={`fixed inset-0 bg-[#333333] z-40 transition-opacity duration-300 ease-in-out pointer-events-none ${isSliderOpen ? 'opacity-70 pointer-events-auto' : 'opacity-0'}`}
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

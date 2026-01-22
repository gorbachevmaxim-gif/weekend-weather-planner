import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { CITIES } from "./constants";
import { CityAnalysisResult, LoadingState } from "./types";
import { analyzeCity, getWeekendDates } from "./services/weatherService";
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
  const [initialDay, setInitialDay] = useState<"saturday" | "sunday">("saturday");

  const dates = useMemo(() => getWeekendDates(), []);

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

  const selectedData = useMemo(() => {
      if (!selectedCity) return null;
      return data.find(c => c.cityName === selectedCity) || null;
  }, [data, selectedCity]);

  const handleCitySelect = (city: string, tab: "w1" | "w2", day: "saturday" | "sunday") => {
      setInitialTab(tab);
      setSelectedCity(city);
      setInitialDay(day);
  };

    if (showLoading) {
            return <LoadingScreen state={loading} onComplete={() => setShowLoading(false)} />;
    }

    return (
        <div className="min-h-screen text-slate-900 pb-10 bg-[#F5F5F5] flex flex-col app-mobile-width">
      
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
            />
        ) : (
            selectedData && (
                <CityDetail 
                    data={selectedData} 
                    initialTab={initialTab}
                    initialDay={initialDay}
                    onClose={() => setSelectedCity(null)} 
                />
            )
        )}
      </div>
    </div>
  );
};

export default App;

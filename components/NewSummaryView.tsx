import React, { useState, useMemo } from "react";
import { CityAnalysisResult } from "../types";
import { useSummaryFiltering } from "../hooks/useSummaryFiltering";
import ArrowDown from "./icons/ArrowDown";
import RoutesIcon from "./icons/RoutesIcon";

interface NewSummaryViewProps {
  data: CityAnalysisResult[];
  onCityClick: (city: string, day: "saturday" | "sunday") => void;
  onCityClickW2: (city: string, day: "saturday" | "sunday") => void;
}

const NewSummaryView: React.FC<NewSummaryViewProps> = ({ data, onCityClick, onCityClickW2 }) => {
  const [activeTab, setActiveTab] = useState<"w1" | "w2">("w1");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const {
    sunnyCities: sunnyCitiesW1,
  } = useSummaryFiltering({ data, isSecondWeekend: false });

  const {
    sunnyCities: sunnyCitiesW2,
  } = useSummaryFiltering({ data, isSecondWeekend: true });

  const sunnyCities = activeTab === "w1" ? sunnyCitiesW1 : sunnyCitiesW2;
  const handleCityClick = activeTab === "w1" ? onCityClick : onCityClickW2;

  const allCities = useMemo(() => data.map(city => city.cityName), [data]);

  return (
    <div>
      <div className="flex">
        <button
          className={`flex-1 text-center py-2 font-sans text-lg font-semibold tracking-tighter ${activeTab === "w1" ? "text-black border-b-2 border-black" : "text-[#B2B2B2] border-b-2 border-[#B2B2B2]"}`}
          onClick={() => setActiveTab("w1")}
        >
          Эти выходные
        </button>
        <button
          className={`flex-1 text-center py-2 font-sans text-lg font-semibold tracking-tighter ${activeTab === "w2" ? "text-black border-b-2 border-black" : "text-[#B2B2B2] border-b-2 border-[#B2B2B2]"}`}
          onClick={() => setActiveTab("w2")}
        >
          Через неделю
        </button>
      </div>
      <div className="mt-6 space-y-2">
        <div>
          <button
            className={`w-full text-3xl font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "saturday"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("saturday")}
          >
            <span className="flex items-center">Суббота<ArrowDown isOpen={openSection === "saturday"} /></span>
          </button>
          {openSection === "saturday" && (
            <div className="mt-4 flex flex-wrap gap-0 pl-4">
              {sunnyCities.saturday.map((city: CityAnalysisResult) => (
                <button
                  key={city.cityName}
                  className="bg-white text-black text-15 tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                  onClick={() => handleCityClick(city.cityName, "saturday")}
                >
                  {city.cityName}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <button
            className={`w-full text-3xl font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "sunday"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("sunday")}
          >
            <span className="flex items-center">Воскресенье<ArrowDown isOpen={openSection === "sunday"} /></span>
          </button>
          {openSection === "sunday" && (
            <div className="mt-4 flex flex-wrap gap-0 pl-4">
              {sunnyCities.sunday.map((city: CityAnalysisResult) => (
                <button
                  key={city.cityName}
                  className="bg-white text-black text-15 tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                  onClick={() => handleCityClick(city.cityName, "sunday")}
                >
                  {city.cityName}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <button
            className={`w-full text-3xl font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "sunny"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("sunny")}
          >
            <span className="flex items-center">Солнечные<ArrowDown isOpen={openSection === "sunny"} /></span>
          </button>
          {openSection === "sunny" && (
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-0 pl-4">
                  <span className="font-normal text-15 bg-[#1E1E1E] text-[#F3F3F3] rounded-full px-4 py-2">СБ</span>
                  {sunnyCities.saturday.map((city: CityAnalysisResult) => (
                    <button
                      key={city.cityName}
                      className="bg-white text-black text-15 tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                      onClick={() => handleCityClick(city.cityName, "saturday")}
                    >
                      {city.cityName}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-0 pl-4">
                  <span className="font-normal text-15 bg-[#1E1E1E] text-[#F3F3F3] rounded-full px-4 py-2">ВС</span>
                  {sunnyCities.sunday.map((city: CityAnalysisResult) => (
                    <button
                      key={city.cityName}
                      className="bg-white text-black text-15 tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                      onClick={() => handleCityClick(city.cityName, "sunday")}
                    >
                      {city.cityName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <button
            className={`w-full text-3xl font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "cities"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("cities")}
          >
            <span className="flex items-center">Города<ArrowDown isOpen={openSection === "cities"} /></span>
          </button>
          {openSection === "cities" && (
            <div className="mt-4 flex flex-wrap gap-0 pl-4">
              {allCities.map((city: string) => (
                <button
                  key={city}
                  className="bg-white text-black text-15 tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                  onClick={() => handleCityClick(city, "saturday")}
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
            className={`flex items-center w-full text-3xl font-unbounded font-semibold text-left px-4 py-px ${
              openSection !== null ? 'text-[#B2B2B2] hover:text-[#777777]' : 'text-[#1E1E1E]'
            } hover:text-[#777777]`}            
          >
            <span className="flex items-center">Маршруты<RoutesIcon /></span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewSummaryView;

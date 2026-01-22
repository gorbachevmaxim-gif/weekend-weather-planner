import React, { useState, useMemo } from "react";
import { CityAnalysisResult } from "../types";
import { useSummaryFiltering } from "../hooks/useSummaryFiltering";
import ArrowDown from "./icons/ArrowDown";
import RoutesIcon from "./icons/RoutesIcon";

interface NewSummaryViewProps {
  data: CityAnalysisResult[];
  onCityClick: (city: string, day: string) => void;
  onCityClickW2: (city: string, day: string) => void;
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
      <div className="mt-6 space-y-1">
        <div>
          <button
            className={`w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "saturday"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("saturday")}
          >
            <span className="flex items-center">Суббота<ArrowDown isOpen={openSection === "saturday"} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          {openSection === "saturday" && (
            <div className="mt-0 flex flex-wrap gap-0 pl-4">
              {sunnyCities.saturday.map((city: CityAnalysisResult) => (
                <button
                  key={city.cityName}
                  className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
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
            className={`w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "sunday"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("sunday")}
          >
            <span className="flex items-center">Воскресенье<ArrowDown isOpen={openSection === "sunday"} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          {openSection === "sunday" && (
            <div className="mt-0 flex flex-wrap gap-0 pl-4">
              {sunnyCities.sunday.map((city: CityAnalysisResult) => (
                <button
                  key={city.cityName}
                  className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                  onClick={() => handleCityClick(city.cityName, "sunday")}
                >
                  {city.cityName}
                </button>
              ))}
            </div>
          )}
        </div>
        {sunnyCities.holidays.map((group: any) => {
          const dateStr = group.dateObj.toISOString().split('T')[0];
          const sectionKey = `holiday_${dateStr}`;
          const isOpen = openSection === sectionKey;
          
          return (
            <div key={sectionKey}>
              <button
                className={`w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
                  isOpen
                    ? "text-[#1E1E1E] hover:text-[#777777]"
                    : openSection === null
                    ? "text-[#1E1E1E] hover:text-[#777777]"
                    : "text-[#B2B2B2] hover:text-[#777777]"
                }`}
                onClick={() => toggleSection(sectionKey)}
              >
                <span className="flex items-center">{group.dayName}<ArrowDown isOpen={isOpen} width="20" height="20" style={{ top: "-7px" }} /></span>
              </button>
              {isOpen && (
                <div className="mt-0 flex flex-wrap gap-0 pl-4">
                  {group.cities.map((city: CityAnalysisResult) => (
                    <button
                      key={city.cityName}
                      className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                      onClick={() => handleCityClick(city.cityName, dateStr)}
                    >
                      {city.cityName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div>
          <button
            className={`w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "sunny"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("sunny")}
          >
            <span className="flex items-center">Солнечные<ArrowDown isOpen={openSection === "sunny"} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          {openSection === "sunny" && (
            <div className="mt-0 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-0 pl-4">
                  <span className="font-normal text-[13px] bg-[#1E1E1E] text-[#F3F3F3] rounded-full px-4 py-2">СБ</span>
                  {sunnyCities.saturday.map((city: CityAnalysisResult) => (
                    <button
                      key={city.cityName}
                      className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                      onClick={() => handleCityClick(city.cityName, "saturday")}
                    >
                      {city.cityName}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-0 pl-4">
                  <span className="font-normal text-[13px] bg-[#1E1E1E] text-[#F3F3F3] rounded-full px-4 py-2">ВС</span>
                  {sunnyCities.sunday.map((city: CityAnalysisResult) => (
                    <button
                      key={city.cityName}
                      className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
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
            className={`w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
              openSection === "cities"
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : openSection === null
                ? "text-[#1E1E1E] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
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
                  className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
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
            className={`flex items-center w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
              openSection !== null ? 'text-[#B2B2B2] hover:text-[#777777]' : 'text-[#1E1E1E]'
            } hover:text-[#777777]`}            
          >
            <span className="flex items-center">Маршруты<RoutesIcon width="19" height="19" style={{ top: "-7px" }} /></span>
          </a>
        </div>
        <div>
          <a
            href="https://spotty-knee-d45.notion.site/2b4539890ee28104bc8aed31be5878f8?v=2b4539890ee281018d17000c41107ec0&source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center w-full text-[26px] font-unbounded font-semibold text-left px-4 py-px ${
              openSection !== null ? 'text-[#B2B2B2] hover:text-[#777777]' : 'text-[#1E1E1E]'
            } hover:text-[#777777]`}            
          >
            <span className="flex items-center">Календарь<RoutesIcon width="19" height="19" style={{ top: "-7px" }} /></span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewSummaryView;

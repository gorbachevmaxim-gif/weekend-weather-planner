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

  const sections = useMemo(() => {
    const activeWeekend = activeTab === "w1" ? "weekend1" : "weekend2";
    const refCity = data.find(c => c[activeWeekend].saturday);
    
    const list = [];
    
    const satDate = refCity?.[activeWeekend].saturday?.dateObj;
    const sunDate = refCity?.[activeWeekend].sunday?.dateObj;
    
    list.push({
        key: "saturday",
        label: "Суббота",
        cities: sunnyCities.saturday,
        date: satDate || new Date(0), 
        isStandard: true
    });
    
    list.push({
        key: "sunday",
        label: "Воскресенье",
        cities: sunnyCities.sunday,
        date: sunDate || new Date(86400000), 
        isStandard: true
    });
    
    sunnyCities.holidays.forEach((h: any) => {
        list.push({
            key: `holiday_${h.dateObj.toISOString().split('T')[0]}`,
            label: h.dayName,
            cities: h.cities,
            date: h.dateObj,
            isStandard: false,
            dateStr: h.dateObj.toISOString().split('T')[0]
        });
    });
    
    if (satDate && sunDate) {
        list.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    
    return list;
  }, [data, activeTab, sunnyCities]);

  return (
    <div>
      <div className="flex">
        <button
          className={`flex-1 text-center py-2 font-sans text-lg font-semibold tracking-tighter ${activeTab === "w1" ? "text-[#333333] border-b-2 border-[#333333]" : "text-[#B2B2B2] border-b-2 border-[#B2B2B2]"}`}
          onClick={() => setActiveTab("w1")}
        >
          Эти выходные
        </button>
        <button
          className={`flex-1 text-center py-2 font-sans text-lg font-semibold tracking-tighter ${activeTab === "w2" ? "text-[#333333] border-b-2 border-[#333333]" : "text-[#B2B2B2] border-b-2 border-[#B2B2B2]"}`}
          onClick={() => setActiveTab("w2")}
        >
          Через неделю
        </button>
      </div>
      <div className="mt-6 space-y-1">
        {sections.map((section) => {
          const isOpen = openSection === section.key;
          return (
            <div key={section.key}>
              <button
                className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
                  isOpen
                    ? "text-[#333333] md:hover:text-[#777777]"
                    : openSection === null
                    ? "text-[#333333] hover:text-[#777777]"
                    : "text-[#B2B2B2] hover:text-[#777777]"
                }`}
                onClick={() => toggleSection(section.key)}
              >
                <span className="flex items-center">{section.label}<ArrowDown isOpen={isOpen} width="20" height="20" style={{ top: "-7px" }} /></span>
              </button>
              {isOpen && (
                <div className="mt-0 flex flex-wrap gap-0 pl-4">
                  {section.cities.map((city: CityAnalysisResult) => (
                    <button
                      key={city.cityName}
                      className="bg-white text-black text-[13px] tracking-tighter rounded-full px-4 py-2 hover:bg-pill-hover"
                      onClick={() => handleCityClick(city.cityName, section.isStandard ? section.key : (section as any).dateStr)}
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
            className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
              openSection === "cities"
                ? "text-[#333333] md:hover:text-[#777777]"
                : openSection === null
                ? "text-[#333333] hover:text-[#777777]"
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
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
              openSection !== null ? 'text-[#B2B2B2] hover:text-[#777777]' : 'text-[#333333]'
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
            className={`flex items-center w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
              openSection !== null && openSection !== "manifesto" ? 'text-[#B2B2B2]' : 'text-[#333333]'
            } hover:text-[#777777]`}            
          >
            <span className="flex items-center">Календарь<RoutesIcon width="19" height="19" style={{ top: "-7px" }} /></span>
          </a>
        </div>
        <div>
          <button
            className={`w-full text-[30px] font-unbounded font-medium text-left px-4 py-px ${
              openSection === "manifesto"
                ? "text-[#333333] md:hover:text-[#777777]"
                : openSection === null
                ? "text-[#333333] hover:text-[#777777]"
                : "text-[#B2B2B2] hover:text-[#777777]"
            }`}
            onClick={() => toggleSection("manifesto")}
          >
            <span className="flex items-center">Манифест<ArrowDown isOpen={openSection === "manifesto"} width="20" height="20" style={{ top: "-7px" }} /></span>
          </button>
          {openSection === "manifesto" && (
            <div className="mt-4 px-4 text-sm leading-relaxed text-[#333333]">
              <div className="mb-6">
                <p>Многие спрашивают, как можно присоединиться к Гастродинамике? Здесь мы описали что нужно делать, чтобы быть внутри нашего комьюнити.</p>
              </div>
              <div className="flex flex-col gap-y-4">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSummaryView;

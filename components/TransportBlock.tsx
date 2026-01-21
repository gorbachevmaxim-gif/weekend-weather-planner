import * as React from "react";
import YandexIcon from "./YandexIcon";
import { CITY_TRANSPORT_CONFIG, MOSCOW_STATION_YANDEX_IDS } from "../transportConfig";

interface TransportBlockProps {
    startCity: string;
    endCity: string;
    startCoords?: {
        lat: number;
        lon: number;
    };
    endCoords?: {
        lat: number;
        lon: number;
    };
    date: Date;
    showTo?: boolean;
    showFrom?: boolean;
}

const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const TransportBlock: React.FC<TransportBlockProps> = ({ startCity, endCity, startCoords, endCoords, date, showTo = true, showFrom = true }) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const dateStrYandex = `${day}.${month}.${year}`;
    const dateStrAeroflot = `${year}${month}${day}`;

    const findNearestStation = (coords?: { lat: number; lon: number }) => {
        if (!coords) return null;
        let closest = null;
        let minD = Infinity;

        const allConfiguredStationsWithCoords = Object.values(CITY_TRANSPORT_CONFIG).filter(
            (config) => config.lat !== undefined && config.lon !== undefined
        );

        for (const st of allConfiguredStationsWithCoords) {
            const d = getDist(coords.lat, coords.lon, st.lat!, st.lon!); // Use '!' for non-null assertion as we filtered them
            if (d < minD) {
                minD = d;
                closest = st;
            }
        }
        if (closest && minD < 5) {
            return closest;
        }
        return null;
    };

    const getCityTransportConfig = (city: string, coords?: { lat: number; lon: number; }) => {
        if (CITY_TRANSPORT_CONFIG[city]) {
            return CITY_TRANSPORT_CONFIG[city];
        }

        const station = findNearestStation(coords);
        if (station) {
            return {
                apiName: station.apiName,
                displayName: station.displayName,
                provider: "yandex",
                yandexId: station.yandexId,
                stationTo: station.stationTo,
                stationFrom: station.stationFrom,
                moscowStation: station.moscowStation,
            };
        }
        return {
            apiName: city,
            displayName: city,
            provider: "yandex",
            stationTo: city,
            stationFrom: city,
            moscowStation: "Вокзал",
        };
    };

    const startConfig = getCityTransportConfig(startCity, startCoords);
    const endConfig = getCityTransportConfig(endCity, endCoords);
    const moscowConfig = {
        apiName: "Москва",
        displayName: "Москва",
        provider: "yandex",
        yandexId: "c213",
    };

    const getUrl = (fromConfig: any, toConfig: any): string => {
        const provider = fromConfig.provider === "aeroflot" || toConfig.provider === "aeroflot" ? "aeroflot" : "yandex";
        if (provider === "aeroflot") {
            const fromCode = fromConfig.apiName === "Москва" ? "MOW" : fromConfig.apiName;
            const toCode = toConfig.apiName === "Москва" ? "MOW" : toConfig.apiName;
            return `https://www.aeroflot.ru/sb/app/ru-ru#/search?adults=1&cabin=economy&children=0&childrenaward=0&childrenfrgn=0&infants=0&routes=${fromCode}.${dateStrAeroflot}.${toCode}`;
        } else {
            const params = new URLSearchParams();
            if (fromConfig.yandexId)
                params.append("fromId", fromConfig.yandexId);
            params.append("fromName", fromConfig.apiName);

            let actualToId = toConfig.yandexId;
            let actualToName = toConfig.apiName;

            if (toConfig.apiName === "Москва" && fromConfig.moscowStation && MOSCOW_STATION_YANDEX_IDS[fromConfig.moscowStation]) {
                actualToId = MOSCOW_STATION_YANDEX_IDS[fromConfig.moscowStation];
                actualToName = fromConfig.moscowStation;
            }

            if (actualToId)
                params.append("toId", actualToId);
            params.append("toName", actualToName);
            params.append("when", dateStrYandex);
            return `https://rasp.yandex.ru/search/suburban/?${params.toString()}`;
        }
    };

    let toUrl: string;
    let fromUrl: string;

    if (endCity === "Москва") {
        toUrl = getUrl(startConfig, endConfig);
        fromUrl = getUrl(endConfig, startConfig);
    } else if (startCity === "Москва") {
        toUrl = getUrl(startConfig, endConfig);
        fromUrl = getUrl(endConfig, startConfig);
    } else {
        toUrl = getUrl(moscowConfig, startConfig);
        fromUrl = getUrl(endConfig, moscowConfig);
    }

    if (!showTo && !showFrom)
        return null;

    return (
        <div className="bg-white rounded-full p-5 space-y-4">
            <div className="space-y-3">
                <div className="flex items-center justify-between px-4 py-3 bg-white border border-2 border-[#edebe5] rounded-full">
                    <div className="flex flex-col pr-6">
                        <span className="text-xs font-medium uppercase mb-1" style={{ color: "#404823" }}>Маршрут</span>
                        <span className="text-[15px] station-name">{startCity}—{endCity}</span>
                    </div>
                </div>
                <div className={`grid gap-3 ${showTo && showFrom ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                    {showTo && (
                        <a href={toUrl} target="_blank" rel="noopener noreferrer" className="station-container flex items-center justify-between px-4 py-3 bg-white border border-2 border-[#edebe5] rounded-full hover-border-3px hover:border-[#4f6814] transition-all group">
                            <div className="flex flex-col pr-6">
                                <span className="text-xs font-medium uppercase mb-1" style={{ color: "#404823" }}>Туда</span>
                                {endCity === "Москва" ? (
                                    <>
                                        <span className="text-[15px] station-name">
                                            со станции {startConfig.stationTo}
                                        </span>
                                        <span className="text-xs text-gray-500">на станцию {startConfig.moscowStation}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[15px] station-name">
                                            {startConfig.stationTo}
                                        </span>
                                        <span className="text-xs text-gray-500">{startConfig.moscowStation}</span>
                                    </>
                                )}
                            </div>
                            <YandexIcon idSuffix="to" />
                        </a>
                    )}
                    {showFrom && (
                        <a href={fromUrl} target="_blank" rel="noopener noreferrer" className="station-container flex items-center justify-between px-4 py-3 bg-white border border-2 border-[#edebe5] rounded-full hover-border-3px hover:border-[#4f6814] transition-all group">
                            <div className="flex flex-col pr-6">
                                <span className="text-xs font-medium uppercase mb-1" style={{ color: "#404823" }}>Обратно</span>
                                {startCity === "Москва" ? (
                                    <>
                                        <span className="text-[15px] station-name">
                                            со станции {endConfig.stationFrom}
                                        </span>
                                        <span className="text-xs text-gray-500">на станцию {endConfig.moscowStation}</span>
                                    </>
                                ) : endCity === "Москва" ? (
                                    <>
                                        <span className="text-[15px] station-name">
                                            со станции {startConfig.moscowStation}
                                        </span>
                                        <span className="text-xs text-gray-500">на станцию {startConfig.stationTo}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[15px] station-name">
                                            {endConfig.stationFrom}
                                        </span>
                                        <span className="text-xs text-gray-500">{endConfig.moscowStation}</span>
                                    </>
                                )}
                            </div>
                            <YandexIcon idSuffix="from" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransportBlock;

import { CITY_TRANSPORT_CONFIG } from "../config/constants";

export const getStationName = (city: string) => {
    return CITY_TRANSPORT_CONFIG[city]?.displayName || city;
};

export const getMoscowStationName = (city: string) => {
    return CITY_TRANSPORT_CONFIG[city]?.moscowStation || "Москва";
};

export const generateTransportLink = (fromCityName: string, toCityName: string, date: Date) => {
    const fromConfig = CITY_TRANSPORT_CONFIG[fromCityName];
    const toConfig = CITY_TRANSPORT_CONFIG[toCityName];

    if (!fromConfig || !toConfig) {
        return "#";
    }

    const isFlight = fromConfig.provider === "aeroflot" || toConfig.provider === "aeroflot";

    if (isFlight) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        
        const fromCode = fromConfig.apiName === "Москва" ? "MOW" : fromConfig.apiName;
        const toCode = toConfig.apiName === "Москва" ? "MOW" : toConfig.apiName;

        return `https://www.aviasales.ru/search/${fromCode}${day}${month}${toCode}1`;
    }

    if (!fromConfig.yandexId || !toConfig.yandexId) {
        console.error("Missing transport config for Yandex link generation", { fromCityName, toCityName, fromConfig, toConfig });
        return "#";
    }

    const fromId = fromConfig.yandexId;
    const fromName = encodeURIComponent(fromConfig.displayName);
    const toId = toConfig.yandexId;
    const toName = encodeURIComponent(toConfig.displayName);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const when = encodeURIComponent(`${day}.${month}.${year}`);

    return `https://rasp.yandex.ru/search/suburban/?fromId=${fromId}&fromName=${fromName}&toId=${toId}&toName=${toName}&when=${when}`;
};

interface TransportConfig {
    apiName: string;
    displayName: string;
    provider: "yandex" | "aeroflot";
    yandexId?: string;
    moscowStation: string;
    fontFamily?: string;
}

export const CITY_TRANSPORT_CONFIG: Record<string, TransportConfig> = {
    "Александров": {
        apiName: "Александров-1",
        displayName: "Александров-1",
        provider: "yandex",
        yandexId: "s9601628",
        moscowStation: "Ярославский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Фетхие": {
        apiName: "DLM",
        displayName: "Даламан",
        provider: "aeroflot",
        moscowStation: "аэропорт",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Кемер": {
        apiName: "AYT",
        displayName: "Анталья",
        provider: "aeroflot",
        moscowStation: "Москва",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Воскресенск": {
        apiName: "88 км",
        displayName: "88 км",
        provider: "yandex",
        yandexId: "s9601903",
        moscowStation: "Казанский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Коломна": {
        apiName: "Голутвин",
        displayName: "Голутвин",
        provider: "yandex",
        yandexId: "s9600716",
        moscowStation: "Казанский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Дубна": {
        apiName: "Большая Волга",
        displayName: "Большая Волга",
        provider: "yandex",
        yandexId: "s9601720",
        moscowStation: "Савёловский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Павловский Посад": {
        apiName: "Павловский Посад",
        displayName: "Павловский Посад",
        provider: "yandex",
        yandexId: "s9601872",
        moscowStation: "Курский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Завидово": {
        apiName: "Новозавидовский",
        displayName: "Новозавидовский",
        provider: "yandex",
        yandexId: "c22478",
        moscowStation: "Ленинградский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
    "Жуковский": {
        apiName: "Отдых",
        displayName: "Отдых",
        provider: "yandex",
        yandexId: "c20571",
        moscowStation: "Казанский вокзал",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    },
};

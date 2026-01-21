import { CityMap, Place, FlightCities } from "./types";

export const CITIES: CityMap = {
    "Москва": { lat: 55.75, lon: 37.61 },
    "Истра": { lat: 55.91, lon: 36.85 },
    "Кубинка": { lat: 55.59, lon: 36.72 },
    "Можайск": { lat: 55.50, lon: 36.03 },
    "Волоколамск": { lat: 56.04, lon: 35.96 },
    "Солнечногорск": { lat: 56.18, lon: 36.98 },
    "Завидово": { lat: 56.52, lon: 36.52 },
    "Дубна": { lat: 56.73, lon: 37.16 },
    "Яхрома": { lat: 56.29, lon: 37.48 },
    "Сергиев Посад": { lat: 56.30, lon: 38.13 },
    "Александров": { lat: 56.39, lon: 38.71 },
    "Павловский Посад": { lat: 55.78, lon: 38.65 },
    "Воскресенск": { lat: 55.32, lon: 38.68 },
    "Коломна": { lat: 55.08, lon: 38.78 },
    "Ступино": { lat: 54.89, lon: 38.08 },
    "Серпухов": { lat: 54.91, lon: 37.41 },
    "Калуга": { lat: 54.51, lon: 36.26 },
    "Обнинск": { lat: 55.11, lon: 36.61 },
    "Наро-Фоминск": { lat: 55.39, lon: 36.73 },
    "Жуковский": { lat: 55.60, lon: 38.12 },
    "Рязань": { lat: 54.62, lon: 39.73 },
    "Одинцово": { lat: 55.67, lon: 37.28 },
    "Зеленоград": { lat: 55.99, lon: 37.21 },
    "Подольск": { lat: 55.43, lon: 37.55 },
    "Тула": { lat: 54.19, lon: 37.61 },
    "Пушкино": { lat: 56.01, lon: 37.85 },
    "Кемер": { lat: 36.60, lon: 30.56 },
    "Звенигород": { lat: 55.73, lon: 36.86 }
};

export const MIN_SUN_HOURS = 6;

// Map Cyrillic City Name -> Latin Filename prefix
// If a city is missing here, it will default to the Cyrillic name.
export const CITY_FILENAMES: Record<string, string> = {
    "Можайск": "Mozhaysk",
    "Жуковский": "Zhukovskyi",
    "Москва": "Moscow",
    "Истра": "Istra",
    "Кубинка": "Kubinka",
    "Волоколамск": "Volokolamsk",
    "Солнечногорск": "Solnechnogorsk",
    "Завидово": "Zavidovo",
    "Дубна": "Dubna",
    "Яхрома": "Yakhroma",
    "Сергиев Посад": "SergievPosad",
    "Александров": "Alexandrov",
    "Павловский Посад": "PavlovskyPosad",
    "Воскресенск": "Voskresensk",
    "Коломна": "Kolomna",
    "Ступино": "Stupino",
    "Серпухов": "Serpukhov",
    "Калуга": "Kaluga",
    "Обнинск": "Obninsk",
    "Наро-Фоминск": "NaroFominsk",
    "Рязань": "Ryazan",
    "Одинцово": "Odintsovo",
    "Зеленоград": "Zelenograd",
    "Подольск": "Podolsk",
    "Тула": "Tula",
    "Пушкино": "Pushkino",
    "Звенигород": "Zvenigorod",
    "Кемер": "Kemer"
};

export const FLIGHT_CITIES: FlightCities = ["Кемер"];

// Map City Name -> Komoot Tour ID
export const KOMOOT_ROUTE_IDS: Record<string, string> = {
    // Пример заполнения:
    // "Коломна": "123456789",
};

// Recommended Places (Gastronomy)
// Add your Yandex Favorites here manually
export const CITY_PLACES: Record<string, Place[]> = {
    "Дубна": [
        { name: "Пиццерони", type: "Пиццерия", address: "пр. Боголюбова, 16А", rating: "4.8", url: "https://yandex.ru/maps/-/CDu~mK3j" },
        { name: "Ибару", type: "Кафе", address: "ул. Вернова, 5", rating: "4.7" },
        { name: "Почемучка", type: "Кофейня", address: "ул. Сахарова, 10", rating: "5.0" },
        { name: "Волга-Волга", type: "Ресторан", address: "наб. Менделеева", rating: "4.9" }
    ],
    "Звенигород": [
         { name: "Здесь был Чехов", type: "Кафе", rating: "4.8" },
         { name: "Луковка", type: "Музей-кафе", rating: "4.9" }
    ],
    "Коломна": [
         { name: "Калачная", type: "Музей", rating: "5.0" },
         { name: "Рульки Вверх", type: "Ресторан", rating: "4.7" }
    ]
    // Add other cities here...
};

export const API_URL = "https://api.open-meteo.com/v1/forecast";

export const gpxFiles = [
  "public/routes/Alexandrov_N_1.gpx",
  "public/routes/Alexandrov_N_2.gpx",
  "public/routes/Dubna_N.gpx",
  "public/routes/Dubna_NE.gpx",
  "public/routes/Istra_N.gpx",
  "public/routes/Istra_NW.gpx",
  "public/routes/Istra_W.gpx",
  "public/routes/Kaluga_NW.gpx",
  "public/routes/Kaluga_SE.gpx",
  "public/routes/Kaluga_SW.gpx",
  "public/routes/Kemer_E.gpx",
  "public/routes/Kemer_N.gpx",
  "public/routes/Kemer_NE.gpx",
  "public/routes/Kolomna_N.gpx",
  "public/routes/Kolomna_NE.gpx",
  "public/routes/Kolomna_S.gpx",
  "public/routes/Kolomna_SE.gpx",
  "public/routes/Kolomna_SW.gpx",
  "public/routes/Kubinka_SW.gpx",
  "public/routes/Kubinka_W_1.gpx",
  "public/routes/Moscow_N.gpx",
  "public/routes/Moscow_NE.gpx",
  "public/routes/Moscow_NW.gpx",
  "public/routes/Moscow_S_1.gpx",
  "public/routes/Moscow_S_2.gpx",
  "public/routes/Moscow_SE.gpx",
  "public/routes/Moscow_SW_1.gpx",
  "public/routes/Moscow_SW_2.gpx",
  "public/routes/Moscow_W.gpx",
  "public/routes/Mozhaysk_N.gpx",
  "public/routes/Mozhaysk_NW.gpx",
  "public/routes/Mozhaysk_S.gpx",
  "public/routes/NaroFominsk_N.gpx",
  "public/routes/NaroFominsk_S.gpx",
  "public/routes/NaroFominsk_SW.gpx",
  "public/routes/NaroFominsk_W.gpx",
  "public/routes/Obninsk_NW.gpx",
  "public/routes/Obninsk_SW.gpx",
  "public/routes/Obninsk_W.gpx",
  "public/routes/PavlovskyPosad_E.gpx",
  "public/routes/PavlovskyPosad_N.gpx",
  "public/routes/PavlovskyPosad_S.gpx",
  "public/routes/Podolsk_E.gpx",
  "public/routes/Podolsk_N.gpx",
  "public/routes/Podolsk_SE.gpx",
  "public/routes/Pushkino_S.gpx",
  "public/routes/Pushkino_SW.gpx",
  "public/routes/Ryazan_E.gpx",
  "public/routes/Ryazan_S.gpx",
  "public/routes/Ryazan_SE.gpx",
  "public/routes/Ryazan_SW.gpx",
  "public/routes/SergievPosad_N.gpx",
  "public/routes/SergievPosad_NE.gpx",
  "public/routes/SergievPosad_SW.gpx",
  "public/routes/Serpukhov_N.gpx",
  "public/routes/Serpukhov_NW.gpx",
  "public/routes/Serpukhov_SW.gpx",
  "public/routes/Serpukhov_W.gpx",
  "public/routes/Solnechnogorsk_N.gpx",
  "public/routes/Solnechnogorsk_NE.gpx",
  "public/routes/Solnechnogorsk_NW.gpx",
  "public/routes/Solnechnogorsk_S.gpx",
  "public/routes/Solnechnogorsk_SW.gpx",
  "public/routes/Stupino_S.gpx",
  "public/routes/Stupino_SW.gpx",
  "public/routes/Stupino_W.gpx",
  "public/routes/Tula_N.gpx",
  "public/routes/Tula_S.gpx",
  "public/routes/Tula_SE.gpx",
  "public/routes/Tula_SW.gpx",
  "public/routes/Tula_W.gpx",
  "public/routes/Volokolamsk_NW.gpx",
  "public/routes/Volokolamsk_S.gpx",
  "public/routes/Volokolamsk_SW.gpx",
  "public/routes/Voskresensk_N.gpx",
  "public/routes/Voskresensk_S.gpx",
  "public/routes/Voskresensk_SW.gpx",
  "public/routes/Yakhroma_S.gpx",
  "public/routes/Yakhroma_W.gpx",
  "public/routes/Zavidovo_N_1.gpx",
  "public/routes/Zavidovo_N_2.gpx",
  "public/routes/Zavidovo_SW.gpx",
  "public/routes/Zavidovo_W.gpx",
  "public/routes/Zelenograd_NW.gpx",
  "public/routes/Zelenograd_SE.gpx",
  "public/routes/Zhukovskyi_NW.gpx",
  "public/routes/Zvenigorod_S.gpx",
  "public/routes/Zvenigorod_SW.gpx",
  "public/routes/Zvenigorod_W.gpx",
];

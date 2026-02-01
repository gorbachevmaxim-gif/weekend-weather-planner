export interface CityCoordinates {
  lat: number;
  lon: number;
}

export interface CityMap {
  [key: string]: CityCoordinates;
}

export interface Place {
  name: string;
  type: string; // e.g. "Кафе", "Ресторан", "Кофейня"
  url?: string; // Link to Yandex Maps
  address?: string;
  rating?: string;
}

export interface WeatherDayStats {
  dateObj: Date;
  dateStr: string;
  dayName: string;
  isDry: boolean;
  isRideable: boolean;
  isMorningRideSuitable: boolean;
  hasRoute: boolean; // New field to indicate if a GPX file exists
  precipSum: number;
  precipitationProbability: number;
  rainHours: string | null;
  tempRange: string;
  feelsRange: string;
  windRange: string;
  windGusts: number;
  windDirection: string;
  windDirFull: string;
  windDeg: number;
  sunSeconds: number;
  sunStr: string;
  accuracy: 'High' | 'Medium' | 'Low';
  clothingHints: string[];

  profileScore?: number;
  rideDuration?: string;
  startTemperature?: number;
  endTemperature?: number;
  temperature900hPa?: number;
  startTemperature900hPa?: number;
  endTemperature900hPa?: number;
  temperature850hPa?: number;
  startTemperature850hPa?: number;
  endTemperature850hPa?: number;
  hourlyWind?: number[]; // Wind speed km/h (slice 09:00-18:00)
  hourlyWindDir?: number[]; // Wind direction degrees (slice 09:00-18:00)
}

export interface CityAnalysisResult {
  cityName: string;
  weekend1: {
    saturday: WeatherDayStats | null;
    sunday: WeatherDayStats | null;
  };
  weekend2: {
    saturday: WeatherDayStats | null;
    sunday: WeatherDayStats | null;
  };
  extraDays: WeatherDayStats[];
}

export interface LoadingState {
  total: number;
  current: number;
  status: string;
}

export type FlightCities = string[];

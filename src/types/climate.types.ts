// Shared climate-related types

// Design day data from Open Meteo API
export interface DesignDayData {
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    windspeed_10m: number[];
    direct_radiation: number[];
    diffuse_radiation: number[];
    direct_normal_irradiance?: number[];
    shortwave_radiation: number[];
    surface_pressure?: number[];
  };
}

// Climate data state interface
export interface ClimateData {
  maxTemp: number;
  maxTempDate: string;
  humidity: number;
  wetBulbTemp: number;
  groundTemp: number;
  pressure: number | null;
  elevation: number | null;
  solarRadiation?: number;
  windSpeed?: string;
  directRadiation?: number;
  diffuseRadiation?: number;
  peakHour?: number;
  designDayData?: DesignDayData;
}
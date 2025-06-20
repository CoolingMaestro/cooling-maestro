import { useState } from "react";
import { CalculationResult } from "../services/calculationService";

export const useCalculationState = () => {
  const [selectedCalculationType, setSelectedCalculationType] = useState<
    "quick" | "detailed" | null
  >(null);
  const [showCalculationForm, setShowCalculationForm] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  return {
    selectedCalculationType,
    setSelectedCalculationType,
    showCalculationForm,
    setShowCalculationForm,
    currentStep,
    setCurrentStep,
    handleStepChange,
    calculationResult,
    setCalculationResult,
  };
};

// Design day data from Open Meteo API
interface DesignDayData {
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
    direct_normal_irradiance: number[];
    shortwave_radiation: number[];
    surface_pressure?: number[];
  };
}

export const useLocationState = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [climateData, setClimateData] = useState<{
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
    designDayData?: DesignDayData; // Tasarım günü saatlik verileri
  } | null>(null);

  return {
    selectedProvince,
    setSelectedProvince,
    selectedDistrict,
    setSelectedDistrict,
    provinces,
    setProvinces,
    districts,
    setDistricts,
    loading,
    setLoading,
    climateData,
    setClimateData,
  };
};

// Product record interface
interface ProductRecord {
  key: string;
  category: string;
  product: string;
  entryTemperature: number;
  dailyAmount: number;
  totalCapacity: number;
  coolingDuration: number;
  onRemove?: (key: string) => void;
}

export const useProductState = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productList, setProductList] = useState<ProductRecord[]>([]);

  return {
    selectedCategory,
    setSelectedCategory,
    selectedProduct,
    setSelectedProduct,
    productList,
    setProductList,
  };
};

export const useWallState = () => {
  // Tip tanımlaması düzeltildi - obje tipinde
  const [wallInsulation, setWallInsulation] = useState<{
    [key: string]: { type: string; uValue: number } | null;
  }>({
    wall1: null,
    wall2: null,
    wall3: null,
    wall4: null,
    wall5: null,
    wall6: null,
  });

  // Kapı verilerinin tipi de düzeltildi
  const [wallDoors, setWallDoors] = useState<{ 
    [key: string]: boolean | { 
      enabled: boolean; 
      width?: number; 
      height?: number; 
      insulationType?: string; 
      uValue?: number 
    } 
  }>({
    wall1: false,
    wall2: false,
    wall3: false,
    wall4: false,
    wall5: false,
    wall6: false,
  });

  // Fonksiyon imzası obje tipini kabul edecek şekilde düzeltildi
  const handleWallInsulationChange = (
    wall: string, 
    insulation: { type: string; uValue: number } | null
  ) => {
    console.log('Wall insulation change:', wall, insulation);
    setWallInsulation((prev) => ({
      ...prev,
      [wall]: insulation,
    }));
  };

  // Kapı değişiklik fonksiyonu da düzeltildi
  const handleWallDoorChange = (
    wall: string, 
    value: boolean | { 
      enabled: boolean; 
      width?: number; 
      height?: number; 
      insulationType?: string; 
      uValue?: number 
    }
  ) => {
    console.log('Wall door change:', wall, value);
    setWallDoors((prev) => ({
      ...prev,
      [wall]: value,
    }));
  };

  return {
    wallInsulation,
    setWallInsulation,
    wallDoors,
    setWallDoors,
    handleWallInsulationChange,
    handleWallDoorChange,
  };
};
// Soğutma Yükü Hesaplama Servisi
// Bu servis tüm soğutma yükü hesaplamalarını içerir
// ASHRAE 2021 Fundamentals standardına göre güncellenmiştir

import { ProductThermalProperty } from './productService';
import { solAirTemperatureService } from './solAirTemperatureService';

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
    direct_normal_irradiance?: number[];
    shortwave_radiation: number[];
    surface_pressure?: number[];
  };
}

// Sabitler
const CONSTANTS = {
  AIR_DENSITY: 1.2, // kg/m³
  AIR_SPECIFIC_HEAT: 1.006, // kJ/kg·K
  WATER_LATENT_HEAT: 2257, // kJ/kg (0°C'de)
  HP_TO_WATT: 746, // 1 HP = 746 W
  // SAFETY_FACTOR: 1.1, // ASHRAE önerisine göre kaldırıldı (oversizing'i önlemek için)
  HOURS_PER_DAY: 24,
  KW_TO_W: 1000,
  KJ_H_TO_W: 1000 / 3600, // kJ/h to W dönüşümü (1 kJ/h = 1000/3600 W = 0.2778 W)
};

// ASHRAE Table 1 - İnsan aktivite tipleri için ısı yükleri (W/person)
// Değerler 23.9°C oda sıcaklığı için geçerlidir
interface ActivityHeatLoad {
  total: number;      // Toplam ısı (W)
  sensible: number;   // Duyulur ısı (W)
  latent: number;     // Gizli ısı (W)
  radiantFraction: number; // Duyulur ısının radyant oranı (0-1)
}

const ACTIVITY_HEAT_LOADS: { [key: string]: ActivityHeatLoad } = {
  "seated_theater": { total: 103, sensible: 72, latent: 31, radiantFraction: 0.60 },
  "seated_very_light": { total: 117, sensible: 72, latent: 45, radiantFraction: 0.60 },
  "moderately_active": { total: 132, sensible: 73, latent: 59, radiantFraction: 0.60 },
  "standing_light": { total: 132, sensible: 73, latent: 59, radiantFraction: 0.58 },
  "walking_standing": { total: 147, sensible: 73, latent: 73, radiantFraction: 0.58 },
  "sedentary_work": { total: 161, sensible: 81, latent: 81, radiantFraction: 0.58 },
  "light_bench": { total: 220, sensible: 81, latent: 139, radiantFraction: 0.49 },
  "moderate_dancing": { total: 249, sensible: 89, latent: 160, radiantFraction: 0.49 },
  "moderate_machine": { total: 293, sensible: 110, latent: 183, radiantFraction: 0.49 },
  "bowling": { total: 425, sensible: 170, latent: 255, radiantFraction: 0.54 },
  "heavy_work": { total: 425, sensible: 170, latent: 255, radiantFraction: 0.54 },
  "heavy_machine": { total: 469, sensible: 186, latent: 283, radiantFraction: 0.54 },
  "athletics": { total: 528, sensible: 208, latent: 320, radiantFraction: 0.54 }
};

// ASHRAE ekipman tipleri için ısı dağılım faktörleri
interface EquipmentHeatFactors {
  usageFactor: number;    // Kullanım faktörü (FU)
  sensibleRatio: number;  // Duyulur ısı oranı
  latentRatio: number;    // Gizli ısı oranı
}

const EQUIPMENT_HEAT_FACTORS: { [key: string]: EquipmentHeatFactors } = {
  "computer_light": { usageFactor: 0.50, sensibleRatio: 1.00, latentRatio: 0.00 }, // Light office use
  "computer_medium": { usageFactor: 0.65, sensibleRatio: 1.00, latentRatio: 0.00 }, // Medium office use
  "computer_heavy": { usageFactor: 0.80, sensibleRatio: 1.00, latentRatio: 0.00 }, // Heavy office use
  "kitchen_hooded": { usageFactor: 0.25, sensibleRatio: 0.34, latentRatio: 0.00 }, // Hooded - sadece radyant
  "kitchen_unhooded": { usageFactor: 0.25, sensibleRatio: 0.34, latentRatio: 0.66 }, // Unhooded - radyant + konvektif + latent
  "medical": { usageFactor: 0.50, sensibleRatio: 0.90, latentRatio: 0.10 }, // Medical equipment
  "industrial": { usageFactor: 0.80, sensibleRatio: 0.95, latentRatio: 0.05 }, // Industrial equipment
  "forklift_electric": { usageFactor: 0.30, sensibleRatio: 0.85, latentRatio: 0.15 }, // Elektrikli forklift (şarj + operasyon)
  "forklift_propane": { usageFactor: 0.30, sensibleRatio: 0.70, latentRatio: 0.30 }, // Propanlı forklift (yanma ürünleri)
  "crane_overhead": { usageFactor: 0.20, sensibleRatio: 0.95, latentRatio: 0.05 }, // Tavan vinci
  "conveyor": { usageFactor: 0.70, sensibleRatio: 0.95, latentRatio: 0.05 }, // Konveyör bant
  "pallet_jack": { usageFactor: 0.25, sensibleRatio: 0.90, latentRatio: 0.10 }, // Elektrikli transpalet
  "battery_charger": { usageFactor: 0.40, sensibleRatio: 0.95, latentRatio: 0.05 }, // Forklift batarya şarj istasyonu
  "general": { usageFactor: 0.50, sensibleRatio: 1.00, latentRatio: 0.00 } // General equipment
};

// Motor verimliliği tablosu (HP aralıklarına göre)
const MOTOR_EFFICIENCY_TABLE = [
  { minHP: 0, maxHP: 1, efficiency: 0.72 },     // Küçük motorlar
  { minHP: 1, maxHP: 5, efficiency: 0.78 },     // 1-5 HP
  { minHP: 5, maxHP: 10, efficiency: 0.82 },    // 5-10 HP
  { minHP: 10, maxHP: 20, efficiency: 0.85 },   // 10-20 HP
  { minHP: 20, maxHP: 50, efficiency: 0.88 },   // 20-50 HP
  { minHP: 50, maxHP: 100, efficiency: 0.90 },  // 50-100 HP
  { minHP: 100, maxHP: 200, efficiency: 0.92 }, // 100-200 HP
  { minHP: 200, maxHP: Infinity, efficiency: 0.94 } // 200+ HP
];

// Tip tanımlamaları
export interface CalculationInput {
  // İklim verileri
  climateData: {
    maxTemperature: number;
    humidity: number;
    wetBulbTemperature: number;
    groundTemperature: number;
    pressure?: number | null;
    elevation?: number | null;
    indoorTemperature?: number; // Bina içi sıcaklık
    indoorHumidity?: number; // Bina içi nem
    designDayData?: DesignDayData; // Tasarım günü saatlik verileri
    maxTempDate?: string; // Maksimum sıcaklık tarihi
  };
  
  // Ürün bilgileri
  products: Array<{
    category: string;
    product: string;
    entryTemperature: number;
    dailyAmount: number;
    totalCapacity: number;
    coolingDuration: number;
    thermalProperties: ProductThermalProperty;
  }>;
  
  // Oda boyutları ve duvar bilgileri
  roomDimensions: {
    width: number;
    depth: number;
    height: number;
    lWidth?: number;
    lDepth?: number;
    tWidth?: number;
    tDepth?: number;
  };
  
  roomType: 'rectangle' | 'L' | 'T';
  buildingLocation: 'inside' | 'outside';
  
  // Duvar yalıtım bilgileri
  wallInsulation: {
    front: { type: string; uValue: number };
    back: { type: string; uValue: number };
    left: { type: string; uValue: number };
    right: { type: string; uValue: number };
    ceiling: { type: string; uValue: number };
    floor: { type: string; uValue: number };
  };
  
  // Kapı bilgileri
  wallDoors: {
    front: { enabled: boolean; width?: number; height?: number; insulationType?: string; uValue?: number };
    back: { enabled: boolean; width?: number; height?: number; insulationType?: string; uValue?: number };
    left: { enabled: boolean; width?: number; height?: number; insulationType?: string; uValue?: number };
    right: { enabled: boolean; width?: number; height?: number; insulationType?: string; uValue?: number };
  };
  
  // İç yükler
  internalLoads: {
    lighting: {
      exclude: boolean;
      totalWatt?: number;
      hoursPerDay?: number;
    };
    people: {
      exclude: boolean;
      count?: number;
      hoursPerDay?: number;
      activityType?: string;
      roomTemperature?: number; // İç ortam sıcaklığı
    };
    motors: {
      exclude: boolean;
      hp?: number;
      count?: number;
      hoursPerDay?: number;
      location?: string; // Motor location: 'both_inside', 'motor_outside', 'equipment_outside'
    };
    equipment: {
      exclude: boolean;
      totalWatt?: number;
      hoursPerDay?: number;
      type?: string; // Equipment type for heat factors
    };
  };
  
  // Hava sızıntısı
  infiltration: {
    anteRoom: 'with' | 'without';
    method: 'airChange' | 'doorOpening' | 'manualEntry';
    // Hava değişimi için
    usage?: 'heavy' | 'average';
    // Kapı açılışı için
    doorPassCount?: number;
    openCloseDuration?: number;
    doorOpenDuration?: number;
    dailyDoorUsageDuration?: number;
    doorWidth?: number;
    doorHeight?: number;
    // Manuel giriş için
    airFlow?: number;
  };
  
  // Hedef sıcaklık (ürün optimal saklama sıcaklığı)
  targetTemperature: number;
}

export interface CalculationResult {
  totalCoolingLoad: number; // W
  breakdown: {
    transmissionLoad: number; // W
    productLoad: number; // W
    internalLoads: number; // W
    infiltrationLoad: number; // W
  };
  details: {
    transmission: {
      walls: number;
      ceiling: number;
      floor: number;
      doors: number;
      total: number;
    };
    product: {
      sensibleHeat: number;
      latentHeat: number;
      respirationHeat: number;
      total: number;
    };
    internal: {
      lighting: number;
      people: number;
      motors: number;
      equipment: number;
      total: number;
    };
    infiltration: {
      airChangeRate: number;
      load: number;
    };
  };
  safetyFactor: number;
  finalCoolingLoad: number; // W (güvenlik faktörü dahil)
}

class CalculationService {
  // Giriş parametrelerini doğrula - Daha esnek validation
  private validateInput(input: CalculationInput): void {
    // İklim verileri kontrolü
    if (!input.climateData) {
      throw new Error('İklim verileri eksik');
    }
    
    if (input.climateData.maxTemperature < -50 || input.climateData.maxTemperature > 60) {
      console.warn('Maksimum sıcaklık aralık dışında, varsayılan değer kullanılacak');
    }
    
    if (input.climateData.humidity < 0 || input.climateData.humidity > 100) {
      console.warn('Nem oranı aralık dışında, varsayılan değer kullanılacak');
    }
    
    // Oda boyutları kontrolü
    if (!input.roomDimensions) {
      throw new Error('Oda boyutları eksik');
    }
    
    const { width, depth, height } = input.roomDimensions;
    if (width <= 0 || depth <= 0 || height <= 0) {
      throw new Error('Oda boyutları pozitif olmalıdır');
    }
    
    if (width > 100 || depth > 100 || height > 20) {
      console.warn('Oda boyutları büyük, hesaplama devam ediyor');
    }
    
    // Hedef sıcaklık kontrolü
    if (input.targetTemperature < -40 || input.targetTemperature > 20) {
      console.warn('Hedef sıcaklık aralık dışında, hesaplama devam ediyor');
    }
    
    // Duvar yalıtım kontrolü - Daha esnek, sadece uyarı ver
    const walls = ['front', 'back', 'left', 'right', 'ceiling', 'floor'] as const;
    walls.forEach(wall => {
      const insulation = input.wallInsulation[wall];
      if (!insulation) {
        console.warn(`${wall} duvarı yalıtım bilgisi eksik, varsayılan değer kullanılacak`);
      } else if (insulation.uValue <= 0 || insulation.uValue > 10) {
        console.warn(`${wall} duvarı U değeri geçersiz (${insulation.uValue}), varsayılan değer kullanılacak`);
      }
    });
  }
  
  // Ana hesaplama fonksiyonu
  calculateCoolingLoad(input: CalculationInput): CalculationResult {
    try {
      // Giriş parametrelerini doğrula
      this.validateInput(input);
      
      console.log('Calculation Input:', input);
    
    // 1. İletim yükü hesapla
    const transmissionDetails = this.calculateTransmissionLoad(input);
    console.log('Transmission Details:', transmissionDetails);
    
    // 2. Ürün yükü hesapla
    const productDetails = this.calculateProductLoad(input);
    console.log('Product Details:', productDetails);
    
    // 3. İç yükleri hesapla
    const internalDetails = this.calculateInternalLoads(input);
    console.log('Internal Details:', internalDetails);
    
    // 4. İnfiltrasyon yükü hesapla
    const infiltrationDetails = this.calculateInfiltrationLoad(input);
    console.log('Infiltration Details:', infiltrationDetails);
    
    // 5. Toplam yükü hesapla
    const totalCoolingLoad = 
      (transmissionDetails.total || 0) +
      (productDetails.total || 0) +
      (internalDetails.total || 0) +
      (infiltrationDetails.load || 0);
    
    console.log('Total Cooling Load:', totalCoolingLoad);
    
    // 6. ASHRAE önerisine göre güvenlik faktörü kaldırıldı
    // Doğru hesaplama ve gerçekçi girdilerle oversizing önlenir
    const finalCoolingLoad = totalCoolingLoad;
    
    console.log('Final Cooling Load:', finalCoolingLoad);
    
      return {
        totalCoolingLoad: isNaN(totalCoolingLoad) ? 0 : totalCoolingLoad,
        breakdown: {
          transmissionLoad: transmissionDetails.total,
          productLoad: productDetails.total,
          internalLoads: internalDetails.total,
          infiltrationLoad: infiltrationDetails.load,
        },
        details: {
          transmission: transmissionDetails,
          product: productDetails,
          internal: internalDetails,
          infiltration: infiltrationDetails,
        },
        safetyFactor: 1.0, // Güvenlik faktörü kaldırıldı
        finalCoolingLoad: isNaN(finalCoolingLoad) ? 0 : finalCoolingLoad,
      };
    } catch (error) {
      console.error('Cooling load calculation error:', error);
      throw error;
    }
  }
  
  // İletim yükü hesaplama - ASHRAE Sol-Air Sıcaklık Yöntemi
  private calculateTransmissionLoad(input: CalculationInput): CalculationResult['details']['transmission'] {
    const { roomDimensions, roomType, wallInsulation, wallDoors, climateData, targetTemperature, buildingLocation } = input;
    
    // Tasar<bm günü verisi varsa kullan, yoksa basit hesaplama yap
    const useDetailedCalculation = buildingLocation === 'outside' && climateData.designDayData;
    
    // Bina içi için basit sıcaklık farkı
    if (buildingLocation === 'inside') {
      const ambientTemp = climateData.indoorTemperature || 25;
      const deltaT = ambientTemp - targetTemperature;
      
      // Duvar alanlarını hesapla
      const areas = this.calculateWallAreas(roomDimensions, roomType);
      
      let walls = 0;
      let doors = 0;
      
      // Her duvar için ısı transferini hesapla
      (['front', 'back', 'left', 'right'] as const).forEach(wall => {
        const wallArea = areas[wall];
        let netWallArea = wallArea;
        
        // Kapı varsa alanını çıkar
        if (wallDoors[wall]?.enabled && wallDoors[wall].width && wallDoors[wall].height) {
          const doorArea = wallDoors[wall].width! * wallDoors[wall].height!;
          netWallArea = Math.max(0, wallArea - doorArea);
          
          // Kapı ısı transferi
          const doorUValue = wallDoors[wall].uValue || 3.5;
          doors += doorUValue * doorArea * deltaT;
        }
        
        // Duvar ısı transferi
        const wallUValue = wallInsulation[wall]?.uValue || 0.5;
        walls += wallUValue * netWallArea * deltaT;
      });
      
      // Tavan ısı transferi
      const ceilingArea = areas.ceiling;
      const ceilingUValue = wallInsulation.ceiling?.uValue || 0.5;
      const ceiling = ceilingUValue * ceilingArea * deltaT;
      
      // Zemin ısı transferi
      const floorArea = areas.floor;
      const floorUValue = wallInsulation.floor?.uValue || 0.5;
      const floorDeltaT = climateData.groundTemperature - targetTemperature;
      const floor = floorUValue * floorArea * floorDeltaT;
      
      const result = {
        walls: isNaN(walls) ? 0 : Math.abs(walls),
        ceiling: isNaN(ceiling) ? 0 : Math.abs(ceiling),
        floor: isNaN(floor) ? 0 : Math.abs(floor),
        doors: isNaN(doors) ? 0 : Math.abs(doors),
        total: 0
      };
      
      result.total = result.walls + result.ceiling + result.floor + result.doors;
      return result;
    }
    
    // Bina dışı için ASHRAE Sol-Air sıcaklık yöntemi
    if (useDetailedCalculation && climateData.designDayData) {
      // Saatlik verilerden pik saati belirle
      const hourlyData = climateData.designDayData.hourly;
      const peakHour = this.findPeakLoadHour(hourlyData, targetTemperature);
      
      // Pik saatteki değerleri kullan
      const outdoorTemp = hourlyData.temperature_2m[peakHour];
      const windSpeed = hourlyData.windspeed_10m[peakHour] || 3;
      const solarRadiation = hourlyData.shortwave_radiation[peakHour] || 0;
      const directNormal = hourlyData.direct_normal_irradiance?.[peakHour] || 0;
      const diffuseHorizontal = hourlyData.diffuse_radiation?.[peakHour] || 0;
      
      // Duvar alanlarını hesapla
      const areas = this.calculateWallAreas(roomDimensions, roomType);
      
      let walls = 0;
      let doors = 0;
      
      // Güneş açılarını hesapla (basitleştirilmiş)
      const solarAngles = solAirTemperatureService.calculateSolarAngles(
        climateData.elevation || 40, // Varsayılan enlem
        30, // Varsayılan boylam
        new Date(`${climateData.maxTempDate}T${peakHour.toString().padStart(2, '0')}:00:00`)
      );
      
      // Her duvar için sol-air sıcaklık ve ısı transferi hesapla
      const wallOrientations = {
        front: 180,  // Güney
        back: 0,     // Kuzey
        left: 90,    // Doğu
        right: 270   // Batı
      };
      
      (['front', 'back', 'left', 'right'] as const).forEach(wall => {
        const wallArea = areas[wall];
        let netWallArea = wallArea;
        
        // Kapı varsa alanını çıkar
        if (wallDoors[wall]?.enabled && wallDoors[wall].width && wallDoors[wall].height) {
          const doorArea = wallDoors[wall].width! * wallDoors[wall].height!;
          netWallArea = Math.max(0, wallArea - doorArea);
          
          // Kapı için basit hesaplama (sol-air yerine dış sıcaklık)
          const doorUValue = wallDoors[wall].uValue || 3.5;
          const doorDeltaT = outdoorTemp - targetTemperature;
          doors += doorUValue * doorArea * doorDeltaT;
        }
        
        // Duvar için sol-air sıcaklık hesapla
        const wallRadiation = solAirTemperatureService.calculateWallSolarRadiation({
          directNormalIrradiance: directNormal,
          diffuseHorizontalIrradiance: diffuseHorizontal,
          globalHorizontalIrradiance: solarRadiation,
          solarAltitude: solarAngles.altitude,
          solarAzimuth: solarAngles.azimuth,
          wallAzimuth: wallOrientations[wall]
        });
        
        const solAirTemp = solAirTemperatureService.calculateSolAirTemperature({
          outdoorTemp: outdoorTemp,
          solarRadiation: wallRadiation,
          surfaceAbsorptance: 0.7, // Tipik değer, ileride veritabanından alınabilir
          windSpeed: windSpeed,
          surfaceType: 'vertical'
        });
        
        const wallUValue = wallInsulation[wall]?.uValue || 0.5;
        const wallDeltaT = solAirTemp - targetTemperature;
        walls += wallUValue * netWallArea * wallDeltaT;
      });
      
      // Tavan için sol-air sıcaklık hesapla
      const ceilingArea = areas.ceiling;
      const ceilingUValue = wallInsulation.ceiling?.uValue || 0.5;
      
      const roofSolAirTemp = solAirTemperatureService.calculateSolAirTemperature({
        outdoorTemp: outdoorTemp,
        solarRadiation: solarRadiation, // Yatay yüzey için doğrudan GHI kullan
        surfaceAbsorptance: 0.8, // Çatı için tipik değer
        windSpeed: windSpeed,
        surfaceType: 'horizontal'
      });
      
      const ceilingDeltaT = roofSolAirTemp - targetTemperature;
      const ceiling = ceilingUValue * ceilingArea * ceilingDeltaT;
      
      // Zemin ısı transferi (sol-air kullanmaya gerek yok)
      const floorArea = areas.floor;
      const floorUValue = wallInsulation.floor?.uValue || 0.5;
      const floorDeltaT = climateData.groundTemperature - targetTemperature;
      const floor = floorUValue * floorArea * floorDeltaT;
      
      const result = {
        walls: isNaN(walls) ? 0 : Math.abs(walls),
        ceiling: isNaN(ceiling) ? 0 : Math.abs(ceiling),
        floor: isNaN(floor) ? 0 : Math.abs(floor),
        doors: isNaN(doors) ? 0 : Math.abs(doors),
        total: 0
      };
      
      result.total = result.walls + result.ceiling + result.floor + result.doors;
      
      console.log('Sol-air temperature calculation details:', {
        peakHour,
        outdoorTemp,
        roofSolAirTemp,
        windSpeed,
        solarRadiation
      });
      
      return result;
    }
    
    // Tasarım günü verisi yoksa basit hesaplama
    const outsideTemp = climateData.maxTemperature;
    const deltaT = outsideTemp - targetTemperature;
    
    console.log('Simple temperature difference calculation:', {
      buildingLocation,
      outsideTemp,
      targetTemperature,
      deltaT
    });
    
    // Duvar alanlarını hesapla
    const areas = this.calculateWallAreas(roomDimensions, roomType);
    
    let walls = 0;
    let doors = 0;
    
    // Her duvar için ısı transferini hesapla
    (['front', 'back', 'left', 'right'] as const).forEach(wall => {
      const wallArea = areas[wall];
      let netWallArea = wallArea;
      
      // Kapı varsa alanını çıkar
      if (wallDoors[wall]?.enabled && wallDoors[wall].width && wallDoors[wall].height) {
        const doorArea = wallDoors[wall].width! * wallDoors[wall].height!;
        netWallArea = Math.max(0, wallArea - doorArea);
        
        // Kapı ısı transferi
        const doorUValue = wallDoors[wall].uValue || 3.5;
        doors += doorUValue * doorArea * deltaT;
      }
      
      // Duvar ısı transferi
      const wallUValue = wallInsulation[wall]?.uValue || 0.5;
      walls += wallUValue * netWallArea * deltaT;
    });
    
    // Tavan ısı transferi
    const ceilingArea = areas.ceiling;
    const ceilingUValue = wallInsulation.ceiling?.uValue || 0.5;
    const ceiling = ceilingUValue * ceilingArea * deltaT;
    
    // Zemin ısı transferi
    const floorArea = areas.floor;
    const floorUValue = wallInsulation.floor?.uValue || 0.5;
    const floorDeltaT = climateData.groundTemperature - targetTemperature;
    const floor = floorUValue * floorArea * floorDeltaT;
    
    const result = {
      walls: isNaN(walls) ? 0 : Math.abs(walls),
      ceiling: isNaN(ceiling) ? 0 : Math.abs(ceiling),
      floor: isNaN(floor) ? 0 : Math.abs(floor),
      doors: isNaN(doors) ? 0 : Math.abs(doors),
      total: 0
    };
    
    result.total = result.walls + result.ceiling + result.floor + result.doors;
    
    console.log('Transmission load breakdown:', result);
    
    return result;
  }
  
  // Pik yük saatini bul
  private findPeakLoadHour(hourlyData: DesignDayData['hourly'], targetTemp: number): number {
    let maxLoad = 0;
    let peakHour = 14; // Varsayılan öğleden sonra
    
    for (let hour = 0; hour < 24; hour++) {
      const temp = hourlyData.temperature_2m[hour];
      const radiation = hourlyData.shortwave_radiation?.[hour] || 0;
      
      // Basitleştirilmiş yük skoru
      const loadScore = (temp - targetTemp) + (radiation * 0.01);
      
      if (loadScore > maxLoad) {
        maxLoad = loadScore;
        peakHour = hour;
      }
    }
    
    return peakHour;
  }
  
  // Ürün yükü hesaplama
  private calculateProductLoad(input: CalculationInput): CalculationResult['details']['product'] {
    let sensibleHeat = 0;
    let latentHeat = 0;
    let respirationHeat = 0;
    
    input.products.forEach(product => {
      const { dailyAmount, entryTemperature, coolingDuration, thermalProperties } = product;
      // Sıfıra bölme kontrolü
      let effectiveCoolingDuration = coolingDuration;
      if (coolingDuration === 0) {
        console.warn(`Ürün ${product.product}: Soğutma süresi 0, varsayılan 24 saat kullanılıyor`);
        effectiveCoolingDuration = 24;
      }
      
      const massFlowRate = dailyAmount / effectiveCoolingDuration; // kg/h (soğutma süresi boyunca)
      
      // Hedef sıcaklık (input'tan gelen targetTemperature kullan)
      const targetTemp = input.targetTemperature;
      
      console.log('Product calculation:', {
        entryTemperature,
        targetTemp,
        freezingPoint: thermalProperties.freezing_point,
        massFlowRate,
        waterContent: thermalProperties.water_content
      });
      
      // 1. Duyulur ısı hesapla
      if (
        thermalProperties.freezing_point !== null &&
        thermalProperties.freezing_point !== undefined
      ) {
        if (entryTemperature > thermalProperties.freezing_point && targetTemp > thermalProperties.freezing_point) {
          // Donma noktası üzerinde
          const deltaT = entryTemperature - targetTemp;
          const specificHeat = thermalProperties.specific_heat_above_freezing ?? 1;
          const safeSpecificHeat = specificHeat ?? 1;
          const heat = massFlowRate * safeSpecificHeat * deltaT;
          sensibleHeat += heat * CONSTANTS.KJ_H_TO_W;
          console.log('Above freezing heat:', heat);
        } else if (entryTemperature > thermalProperties.freezing_point && targetTemp < thermalProperties.freezing_point) {
          // Donma noktasını geçiyor
          // Önce donma noktasına kadar soğut
          const deltaT1 = entryTemperature - thermalProperties.freezing_point;
          const specificHeatAbove = thermalProperties.specific_heat_above_freezing;
          const specificHeatBelow = thermalProperties.specific_heat_below_freezing;
          
          if (!specificHeatAbove || !specificHeatBelow) {
            console.warn('Missing specific heat values for product crossing freezing point');
            return;
          }
          
          const heat1 = massFlowRate * specificHeatAbove * deltaT1;
          
          // Donma noktasından hedef sıcaklığa
          const deltaT2 = thermalProperties.freezing_point - targetTemp;
          const heat2 = massFlowRate * specificHeatBelow * deltaT2;
          
          const totalHeat = (heat1 + heat2) * CONSTANTS.KJ_H_TO_W;
          sensibleHeat += totalHeat;
          console.log('Crossing freezing point heat:', { heat1, heat2, totalHeat });
        } else {
          // Donma noktası altında
          const deltaT = entryTemperature - targetTemp;
          const specificHeat = thermalProperties.specific_heat_below_freezing;
          
          if (!specificHeat) {
            console.warn('Missing specific_heat_below_freezing for product below freezing point');
            return;
          }
          
          const heat = massFlowRate * specificHeat * deltaT;
          sensibleHeat += heat * CONSTANTS.KJ_H_TO_W;
          console.log('Below freezing heat:', heat);
        }
      } else {
        console.warn('thermalProperties.freezing_point is null or undefined, skipping sensible heat calculation for this product.');
      }
      
      // 2. Gizli ısı hesapla (donma için)
      if (
        thermalProperties.freezing_point !== null &&
        thermalProperties.freezing_point !== undefined &&
        thermalProperties.latent_heat_fusion !== null &&
        thermalProperties.latent_heat_fusion !== undefined &&
        entryTemperature > thermalProperties.freezing_point &&
        targetTemp < thermalProperties.freezing_point
      ) {
        const waterContent = (thermalProperties.water_content ?? 0) / 100; // Yüzde olarak
        const latentHeatValue = massFlowRate * thermalProperties.latent_heat_fusion * waterContent;
        latentHeat += latentHeatValue * CONSTANTS.KJ_H_TO_W;
        console.log('Latent heat:', latentHeatValue);
      }
      
      // 3. Solunum ısısı hesapla
      const respirationRate = thermalProperties.respiration_rate_20c || thermalProperties.respiration_rate || 0;
      if (respirationRate > 0) {
        // Q10 değerini al (varsayılan: 2.0)
        const Q10 = thermalProperties.q10_value || 2.0;
        
        // Solunum oranını sıcaklığa göre ayarla
        const tempDiff = (targetTemp - 20) / 10;
        const adjustedRespirationRate = respirationRate * Math.pow(Q10, tempDiff);
        
        // mg CO2/kg·h to W conversion
        // 1 mg CO2/kg·h ≈ 0.272 J/kg·h = 0.0000756 W/kg (ASHRAE 2018)
        const respirationFactor = 0.0000756; // W·kg⁻¹ per mg CO2·kg⁻¹·h⁻¹
        respirationHeat += product.totalCapacity * adjustedRespirationRate * respirationFactor;
      }
    });
    
    const sensibleHeatFinal = isNaN(sensibleHeat) ? 0 : sensibleHeat;
    const latentHeatFinal = isNaN(latentHeat) ? 0 : latentHeat;
    const respirationHeatFinal = isNaN(respirationHeat) ? 0 : respirationHeat;
    const total = sensibleHeatFinal + latentHeatFinal + respirationHeatFinal;
    
    return {
      sensibleHeat: sensibleHeatFinal,
      latentHeat: latentHeatFinal,
      respirationHeat: respirationHeatFinal,
      total: total,
    };
  }
  
  // İç yükleri hesaplama
  private calculateInternalLoads(input: CalculationInput): CalculationResult['details']['internal'] {
    const { internalLoads } = input;
    
    console.log('Internal Loads Input:', internalLoads);
    
    let lighting = 0;
    let people = 0;
    let motors = 0;
    let equipment = 0;
    
    // Aydınlatma yükü
    if (!internalLoads.lighting.exclude && internalLoads.lighting.totalWatt && internalLoads.lighting.totalWatt > 0 && 
        internalLoads.lighting.hoursPerDay && internalLoads.lighting.hoursPerDay > 0) {
      const dailyFactor = internalLoads.lighting.hoursPerDay / CONSTANTS.HOURS_PER_DAY;
      lighting = internalLoads.lighting.totalWatt * dailyFactor;
    }
    
    // İnsan yükü - ASHRAE Table 1 değerleri kullanılıyor
    if (!internalLoads.people.exclude && internalLoads.people.count && internalLoads.people.count > 0 && 
        internalLoads.people.hoursPerDay && internalLoads.people.hoursPerDay > 0) {
      const dailyFactor = internalLoads.people.hoursPerDay / CONSTANTS.HOURS_PER_DAY;
      
      // Aktivite tipine göre ısı yüklerini al
      const activityData = internalLoads.people.activityType && ACTIVITY_HEAT_LOADS[internalLoads.people.activityType];
      
      if (activityData) {
        // Oda sıcaklığına göre düzeltme faktörü
        // const roomTemp = internalLoads.people.roomTemperature || 23.9; // Varsayılan 23.9°C
        
        // 26.7°C için duyulur ısı %20 azaltılır (ASHRAE Note 1)
        // Şu anda toplam ısı kullanılıyor, gelecekte duyulur/gizli ayrımı yapılabilir
        // const roomTemp = internalLoads.people.roomTemperature || 23.9;
        // let sensibleHeat = activityData.sensible;
        // if (roomTemp >= 26.7) {
        //   const adjustment = 0.8; // %20 azaltma
        //   sensibleHeat = activityData.sensible * adjustment;
        //   latentHeat = activityData.total - sensibleHeat;
        // }
        
        // Toplam insan yükü
        people = internalLoads.people.count * activityData.total * dailyFactor;
      } else {
        // Varsayılan değer: orta aktivite (150W)
        people = internalLoads.people.count * 150 * dailyFactor;
      }
    }
    
    // Motor yükü - ASHRAE Equation (2), (3) ve (4)
    if (!internalLoads.motors.exclude && internalLoads.motors.hp && internalLoads.motors.hp > 0 && 
        internalLoads.motors.count && internalLoads.motors.count > 0 && 
        internalLoads.motors.hoursPerDay && internalLoads.motors.hoursPerDay > 0) {
      const dailyFactor = internalLoads.motors.hoursPerDay / CONSTANTS.HOURS_PER_DAY;
      const motorWatts = internalLoads.motors.hp * CONSTANTS.HP_TO_WATT * internalLoads.motors.count;
      
      // Motor verimliliğini HP'ye göre belirle
      const efficiency = this.getMotorEfficiency(internalLoads.motors.hp);
      
      // Motor konumuna göre ısı yükü hesapla
      const location = internalLoads.motors.location || 'both_inside';
      
      switch (location) {
        case 'both_inside':
          // ASHRAE Equation (2): Motor ve ekipman içeride
          // qem = P/EM × FUM × FLM
          motors = (motorWatts / efficiency) * dailyFactor;
          break;
          
        case 'motor_outside':
          // ASHRAE Equation (3): Motor dışarıda, ekipman içeride
          // qem = P × FUM × FLM
          motors = motorWatts * dailyFactor;
          break;
          
        case 'equipment_outside':
          // ASHRAE Equation (4): Motor içeride, ekipman dışarıda
          // qem = P × (1 - EM)/EM × FUM × FLM
          motors = motorWatts * ((1 - efficiency) / efficiency) * dailyFactor;
          break;
          
        default:
          // Varsayılan: Her ikisi de içeride
          motors = (motorWatts / efficiency) * dailyFactor;
      }
    }
    
    // Ekipman yükü - ASHRAE equipment factors kullanılıyor
    if (!internalLoads.equipment.exclude && internalLoads.equipment.totalWatt && internalLoads.equipment.totalWatt > 0 && 
        internalLoads.equipment.hoursPerDay && internalLoads.equipment.hoursPerDay > 0) {
      const dailyFactor = internalLoads.equipment.hoursPerDay / CONSTANTS.HOURS_PER_DAY;
      
      // Ekipman tipine göre faktörleri al
      const equipmentType = internalLoads.equipment.type || 'general';
      const heatFactors = EQUIPMENT_HEAT_FACTORS[equipmentType] || EQUIPMENT_HEAT_FACTORS['general'];
      
      // ASHRAE: Nameplate power × Usage factor × Daily factor
      equipment = internalLoads.equipment.totalWatt * heatFactors.usageFactor * dailyFactor;
    }
    
    return {
      lighting: isNaN(lighting) ? 0 : lighting,
      people: isNaN(people) ? 0 : people,
      motors: isNaN(motors) ? 0 : motors,
      equipment: isNaN(equipment) ? 0 : equipment,
      total: isNaN(lighting + people + motors + equipment) ? 0 : lighting + people + motors + equipment,
    };
  }
  
  // İnfiltrasyon yükü hesaplama
  private calculateInfiltrationLoad(input: CalculationInput): CalculationResult['details']['infiltration'] {
    const { infiltration, roomDimensions, roomType, climateData, targetTemperature, buildingLocation } = input;
    
    // Oda hacmini hesapla
    const volume = this.calculateRoomVolume(roomDimensions, roomType);
    
    let airChangeRate = 0; // hava değişim/saat
    
    // Hava değişim oranını belirle
    if (infiltration.method === 'airChange') {
      // ASHRAE Table 13.1 - Soğuk depo hava değişim oranları
      // Sıcaklık aralığına göre ayarla
      let baseRate = 0;
      
      if (targetTemperature > 0) {
        // Soğuk oda (0°C üzeri)
        if (infiltration.anteRoom === 'with') {
          baseRate = infiltration.usage === 'heavy' ? 3.0 : 2.0;
        } else {
          baseRate = infiltration.usage === 'heavy' ? 6.0 : 4.0;
        }
      } else {
        // Dondurucu oda (0°C altı)
        if (infiltration.anteRoom === 'with') {
          baseRate = infiltration.usage === 'heavy' ? 2.0 : 1.0;
        } else {
          baseRate = infiltration.usage === 'heavy' ? 4.0 : 2.5;
        }
      }
      
      // Hacim faktörü (küçük odalar için artırım)
      const volumeFactor = volume < 100 ? 1.5 : volume < 500 ? 1.2 : 1.0;
      airChangeRate = baseRate * volumeFactor;
    } else if (infiltration.method === 'doorOpening') {
      // Kapı açılışlarına göre hesapla
      const doorPassages = infiltration.doorPassCount || 0;
      const openDuration = infiltration.openCloseDuration || 0;
      const doorOpenTime = infiltration.doorOpenDuration || 0;
      const dailyUsageHours = infiltration.dailyDoorUsageDuration || 0;
      
      // Toplam açık kalma süresi (saat)
      const totalOpenHours = (doorPassages * openDuration / 3600) + (doorOpenTime / 60);
      
      // Hava değişim oranı hesaplaması
      // Saatte ortalama kapı açık kalma oranı
      // const openRatio = dailyUsageHours > 0 ? totalOpenHours / dailyUsageHours : 0; // Şu anda kullanılmıyor
      
      // ASHRAE'ye göre kapı açıklığından infiltrasyon
      // Formül: V_inf = A_door × v_air × Dt × Df × (1 - E)
      // A_door: Kapı alanı (m²)
      // v_air: Hava hızı (m/s) - tipik 0.5-1.0 m/s
      // Dt: Sıcaklık farkı faktörü
      // Df: Yoğunluk farkı faktörü
      // E: Etkinlik faktörü (ön oda varsa 0.5, yoksa 0)
      
      // Kapı boyutları (kullanıcı girişi veya varsayılan)
      const doorHeight = infiltration.doorHeight || 2.5; // m
      const doorWidth = infiltration.doorWidth || 2.0; // m
      const doorArea = doorHeight * doorWidth;
      
      // Hava hızı (m/s) - sıcaklık farkına bağlı
      const tempDiff = Math.abs(climateData.maxTemperature - targetTemperature);
      const airVelocity = 0.223 * Math.sqrt(doorHeight * tempDiff / 283); // ASHRAE formülü
      
      // Etkinlik faktörü
      const effectiveness = infiltration.anteRoom === 'with' ? 0.5 : 0;
      
      // Toplam infiltrasyon hacmi (m³)
      const totalInfiltrationVolume = doorArea * airVelocity * totalOpenHours * 3600 * (1 - effectiveness);
      
      // Hava değişim oranı
      airChangeRate = (totalInfiltrationVolume / volume) / dailyUsageHours;
    } else if (infiltration.method === 'manualEntry') {
      // Manuel hava debisi girişi
      const airFlow = infiltration.airFlow || 0; // m³/saat
      airChangeRate = airFlow / volume;
    }
    
    // Hava özelliklerini düzelt
    const elevation = climateData.elevation || 0; // metre
    const pressure = climateData.pressure || (101.325 * Math.exp(-elevation / 8400)); // kPa
    const airDensityAdjusted = CONSTANTS.AIR_DENSITY * (pressure / 101.325); // Basınca göre düzeltilmiş yoğunluk
    
    // Nem içeriği hesapla (kg su / kg kuru hava)
    const outsideTemp = buildingLocation === 'outside' 
      ? climateData.maxTemperature 
      : (climateData.indoorTemperature || 25);
    const outsideHumidity = buildingLocation === 'outside' 
      ? climateData.humidity 
      : (climateData.indoorHumidity || 50);
    
    const outsideHumidityRatio = this.calculateHumidityRatio(outsideTemp, outsideHumidity, pressure);
    const insideHumidityRatio = this.calculateHumidityRatio(targetTemperature, 90, pressure); // Soğuk oda için %90 nem varsayımı
    
    // Sıcaklık farkı
    const deltaT = outsideTemp - targetTemperature;
    
    // Duyulur ısı yükü: Q_sensible = V × ρ × c × ΔT × n
    const sensibleLoad = volume * airDensityAdjusted * CONSTANTS.AIR_SPECIFIC_HEAT * 
                        deltaT * airChangeRate * CONSTANTS.KJ_H_TO_W;
    
    // Gizli ısı yükü (nem farkından): Q_latent = V × ρ × L × Δw × n
    const deltaHumidity = Math.max(0, outsideHumidityRatio - insideHumidityRatio); // kg su / kg hava
    const latentLoad = volume * airDensityAdjusted * CONSTANTS.WATER_LATENT_HEAT * 
                      deltaHumidity * airChangeRate * CONSTANTS.KJ_H_TO_W;
    
    // Toplam infiltrasyon yükü
    const infiltrationLoad = Math.abs(sensibleLoad) + Math.abs(latentLoad); // Negatif değerleri pozitif yap
    
    console.log('Infiltration calculation:', {
      volume,
      airChangeRate,
      pressure,
      airDensityAdjusted,
      outsideHumidityRatio,
      insideHumidityRatio,
      sensibleLoad,
      latentLoad,
      totalLoad: infiltrationLoad
    });
    
    return {
      airChangeRate: isNaN(airChangeRate) ? 0 : airChangeRate,
      load: isNaN(infiltrationLoad) ? 0 : infiltrationLoad,
    };
  }
  
  // Duvar alanlarını hesapla
  private calculateWallAreas(dimensions: CalculationInput['roomDimensions'], roomType: string) {
    const { width, depth, height, lWidth = 0, lDepth = 0, tWidth = 0, tDepth = 0 } = dimensions;
    
    let areas = {
      front: 0,
      back: 0,
      left: 0,
      right: 0,
      ceiling: 0,
      floor: 0,
    };
    
    if (roomType === 'rectangle') {
      areas = {
        front: width * height,
        back: width * height,
        left: depth * height,
        right: depth * height,
        ceiling: width * depth,
        floor: width * depth,
      };
    } else if (roomType === 'L') {
      // L tipi oda için alan hesaplaması
      // L şekli: Ana dikdörtgen + sağ alt köşede ek alan
      //  ┌───────┐
      //  │       │
      //  │   ┌───┤
      //  │   │   │
      //  └───┴───┘
      
      // Duvar alanları
      areas = {
        // Ön duvar: Ana genişlik
        front: width * height,
        
        // Arka duvar: İki parça - ana kısım + L uzantısı
        back: ((width - lWidth) * height) + (lWidth * height),
        
        // Sol duvar: Tam derinlik
        left: depth * height,
        
        // Sağ duvar: İki parça - ana kısım + L çıkıntısı
        right: ((depth - lDepth) * height) + (lDepth * height),
        
        // Tavan ve zemin: Toplam alan
        ceiling: (width * depth) - (lWidth * lDepth) + (lWidth * lDepth),
        floor: (width * depth),
      };
    } else if (roomType === 'T') {
      // T tipi oda için alan hesaplaması  
      // T şekli: Ana dikdörtgen + üst ortada uzantı
      //    ┌───┐
      //  ┌─┴───┴─┐
      //  │       │
      //  │       │
      //  └───────┘
      
      areas = {
        // Ön duvar: Tam genişlik (ana + T uzantısı)
        front: width * height,
        
        // Arka duvar: Tam genişlik
        back: width * height,
        
        // Sol duvar: İki parça - ana kısım + T sol duvarı
        left: (depth * height) + ((tDepth / 2) * height),
        
        // Sağ duvar: İki parça - ana kısım + T sağ duvarı  
        right: (depth * height) + ((tDepth / 2) * height),
        
        // Tavan ve zemin: Toplam alan
        ceiling: (width * depth) + (tWidth * tDepth),
        floor: (width * depth) + (tWidth * tDepth),
      };
    }
    
    return areas;
  }
  
  // Oda hacmini hesapla
  private calculateRoomVolume(dimensions: CalculationInput['roomDimensions'], roomType: string): number {
    const { width, depth, height, lWidth = 0, lDepth = 0, tWidth = 0, tDepth = 0 } = dimensions;
    
    if (roomType === 'rectangle') {
      return width * depth * height;
    } else if (roomType === 'L') {
      return (width * depth * height) + (lWidth * lDepth * height);
    } else if (roomType === 'T') {
      return (width * depth * height) + (tWidth * tDepth * height);
    }
    
    return 0;
  }
  
  // Motor verimliliğini HP'ye göre belirle
  private getMotorEfficiency(hp: number): number {
    const efficiencyEntry = MOTOR_EFFICIENCY_TABLE.find(
      entry => hp >= entry.minHP && hp < entry.maxHP
    );
    return efficiencyEntry ? efficiencyEntry.efficiency : 0.85; // Varsayılan
  }
  
  // Nem oranı hesapla (kg su / kg kuru hava)
  private calculateHumidityRatio(temperature: number, relativeHumidity: number, pressure: number): number {
    let saturationPressure: number;
    
    if (temperature >= 0) {
      // Su üzerinde doyma basıncı (0°C ve üzeri) - ASHRAE formülü
      const T = temperature + 273.15; // Kelvin'e çevir
      const C1 = -5.6745359e3;
      const C2 = 6.3925247;
      const C3 = -9.677843e-3;
      const C4 = 6.2215701e-7;
      const C5 = 2.0747825e-9;
      const C6 = -9.484024e-13;
      const C7 = 4.1635019;
      
      const lnPws = C1/T + C2 + C3*T + C4*T*T + C5*T*T*T + C6*T*T*T*T + C7*Math.log(T);
      saturationPressure = Math.exp(lnPws) / 1000; // Pa'dan kPa'ya çevir
    } else {
      // Buz üzerinde doyma basıncı (0°C altı) - ASHRAE formülü
      const T = temperature + 273.15; // Kelvin'e çevir
      const C1 = -5.8666426e3;
      const C2 = 2.232870244e1;
      const C3 = 1.39387003e-2;
      const C4 = -3.4262402e-5;
      const C5 = 2.7040955e-8;
      const C6 = 6.7063522e-1;
      
      const lnPwi = C1/T + C2 + C3*T + C4*T*T + C5*T*T*T + C6*Math.log(T);
      saturationPressure = Math.exp(lnPwi) / 1000; // Pa'dan kPa'ya çevir
    }
    
    // Kısmi buhar basıncı
    const partialPressure = (relativeHumidity / 100) * saturationPressure;
    
    // Nem oranı (paydanın sıfır olmaması kontrolü)
    const denominator = pressure - partialPressure;
    if (denominator <= 0) {
      console.warn('Nem oranı hesaplamasında geçersiz değer, varsayılan kullanılıyor');
      return 0.01; // Varsayılan nem oranı
    }
    
    const humidityRatio = 0.622 * partialPressure / denominator;
    
    return humidityRatio;
  }
}

export const calculationService = new CalculationService();
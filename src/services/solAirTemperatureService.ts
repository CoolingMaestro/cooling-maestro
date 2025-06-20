// ASHRAE 2021 Fundamentals Chapter 18'e göre Sol-Air Sıcaklık Hesaplama Servisi

interface SolAirCalculationParams {
  outdoorTemp: number;           // Dış hava sıcaklığı (°C)
  solarRadiation: number;        // Toplam güneş radyasyonu Et (W/m²)
  surfaceAbsorptance: number;    // Yüzey güneş soğurma katsayısı α (0-1)
  windSpeed: number;             // Rüzgar hızı (m/s)
  surfaceType: 'horizontal' | 'vertical'; // Yüzey tipi
  surfaceEmissivity?: number;    // Yüzey yayma katsayısı ε (varsayılan: 0.9)
}

interface WallSolarRadiationParams {
  directNormalIrradiance: number;  // DNI (W/m²)
  diffuseHorizontalIrradiance: number; // DHI (W/m²)
  globalHorizontalIrradiance: number; // GHI (W/m²)
  solarAltitude: number;         // Güneş yükseklik açısı (derece)
  solarAzimuth: number;          // Güneş azimut açısı (derece)
  wallAzimuth: number;           // Duvar azimut açısı (0=Kuzey, 90=Doğu, 180=Güney, 270=Batı)
  groundReflectance?: number;    // Zemin yansıtma katsayısı (varsayılan: 0.2)
}

class SolAirTemperatureService {
  // ASHRAE sabitleri
  private readonly DEFAULT_EMISSIVITY = 0.9;
  private readonly DEFAULT_GROUND_REFLECTANCE = 0.2;
  private readonly HORIZONTAL_DELTA_R = 63; // W/m² (yatay yüzeyler için)
  private readonly VERTICAL_DELTA_R = 0;    // W/m² (dikey yüzeyler için)

  /**
   * ASHRAE Equation 29'a göre sol-air sıcaklık hesaplama
   * te = to + (α·Et/ho) - (ε·ΔR/ho)
   */
  calculateSolAirTemperature(params: SolAirCalculationParams): number {
    const {
      outdoorTemp,
      solarRadiation,
      surfaceAbsorptance,
      windSpeed,
      surfaceType,
      surfaceEmissivity = this.DEFAULT_EMISSIVITY
    } = params;

    // Dış yüzey film katsayısı hesapla (W/m²·K)
    // ASHRAE: ho = 5.7 + 3.8V (V: rüzgar hızı m/s)
    const ho = 5.7 + 3.8 * windSpeed;

    // Uzun dalga radyasyon düzeltmesi
    const deltaR = surfaceType === 'horizontal' 
      ? this.HORIZONTAL_DELTA_R 
      : this.VERTICAL_DELTA_R;

    // Sol-air sıcaklık hesapla
    const solAirTemp = outdoorTemp + 
      (surfaceAbsorptance * solarRadiation / ho) - 
      (surfaceEmissivity * deltaR / ho);

    return solAirTemp;
  }

  /**
   * Duvar yönüne göre toplam güneş radyasyonu hesaplama
   * Et = Eb + Ed + Er (direkt + difüz + yansıyan)
   */
  calculateWallSolarRadiation(params: WallSolarRadiationParams): number {
    const {
      directNormalIrradiance,
      diffuseHorizontalIrradiance,
      globalHorizontalIrradiance,
      solarAltitude,
      solarAzimuth,
      wallAzimuth,
      groundReflectance = this.DEFAULT_GROUND_REFLECTANCE
    } = params;

    // Açıları radyana çevir
    const toRad = (deg: number) => deg * Math.PI / 180;
    const solarAltRad = toRad(solarAltitude);
    const solarAzRad = toRad(solarAzimuth);
    const wallAzRad = toRad(wallAzimuth);

    // Güneş geliş açısı (angle of incidence) hesapla
    // cos(θ) = sin(β)·cos(γ-γs)
    // β: solar altitude, γ: wall azimuth, γs: solar azimuth
    const incidenceAngle = Math.acos(
      Math.sin(solarAltRad) * Math.cos(wallAzRad - solarAzRad)
    );

    // 1. Direkt radyasyon bileşeni
    // Sadece güneş duvara bakıyorsa (cos(θ) > 0)
    const cosIncidence = Math.cos(incidenceAngle);
    const directComponent = cosIncidence > 0 
      ? directNormalIrradiance * cosIncidence 
      : 0;

    // 2. Difüz radyasyon bileşeni
    // Dikey yüzey için view factor = 0.5 (gökyüzünün yarısını görür)
    const diffuseComponent = diffuseHorizontalIrradiance * 0.5;

    // 3. Yansıyan radyasyon bileşeni
    // Zeminden yansıyan = GHI × ρ × (1-cos(tilt))/2
    // Dikey duvar için tilt = 90°, yani factor = 0.5
    const reflectedComponent = globalHorizontalIrradiance * groundReflectance * 0.5;

    // Toplam güneş radyasyonu
    return directComponent + diffuseComponent + reflectedComponent;
  }

  /**
   * Yatay yüzeyler (çatı) için güneş radyasyonu
   * Doğrudan GHI kullanılır
   */
  calculateRoofSolarRadiation(globalHorizontalIrradiance: number): number {
    return globalHorizontalIrradiance;
  }

  /**
   * Güneş açılarını hesapla (basitleştirilmiş)
   * Daha detaylı hesaplama için ASHRAE Chapter 14 formülleri kullanılmalı
   */
  calculateSolarAngles(
    latitude: number,
    longitude: number,
    dateTime: Date,
    timezone: string = 'Europe/Istanbul'
  ): { altitude: number; azimuth: number } {
    // Bu basitleştirilmiş bir örnektir
    // Gerçek uygulamada ASHRAE Chapter 14 formülleri veya 
    // solar position kütüphanesi kullanılmalı
    
    const hour = dateTime.getHours();
    const dayOfYear = this.getDayOfYear(dateTime);
    
    // Güneş deklinasyon açısı
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    
    // Saat açısı (solar noon = 0)
    const hourAngle = 15 * (hour - 12);
    
    // Basitleştirilmiş güneş yükseklik açısı
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const hourRad = hourAngle * Math.PI / 180;
    
    const altitude = Math.asin(
      Math.sin(latRad) * Math.sin(decRad) + 
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad)
    ) * 180 / Math.PI;
    
    // Basitleştirilmiş azimut açısı
    const azimuth = hour < 12 ? 90 + (12 - hour) * 15 : 270 - (hour - 12) * 15;
    
    return { altitude: Math.max(0, altitude), azimuth };
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}

export const solAirTemperatureService = new SolAirTemperatureService();
export type { SolAirCalculationParams, WallSolarRadiationParams };
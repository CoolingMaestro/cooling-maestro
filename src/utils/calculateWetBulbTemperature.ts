/**
 * Yaş termometre sıcaklığı hesaplaması
 * ASHRAE Fundamentals 2017 Chapter 1'e göre iteratif yöntem kullanılarak
 * @param dryBulbTemp - Kuru termometre sıcaklığı (°C)
 * @param relativeHumidity - Bağıl nem (%)
 * @param pressure - Atmosferik basınç (kPa) - varsayılan: 101.325 kPa (deniz seviyesi)
 * @returns Yaş termometre sıcaklığı (°C)
 */
export const calculateWetBulbTemperature = (
  dryBulbTemp: number,
  relativeHumidity: number,
  pressure: number = 101.325
): number => {
  // Giriş değerlerini doğrula
  if (dryBulbTemp < -100 || dryBulbTemp > 100) {
    throw new Error('Kuru termometre sıcaklığı -100°C ile 100°C arasında olmalıdır');
  }
  if (relativeHumidity < 0 || relativeHumidity > 100) {
    throw new Error('Bağıl nem %0 ile %100 arasında olmalıdır');
  }
  if (pressure < 10 || pressure > 200) {
    throw new Error('Basınç 10 kPa ile 200 kPa arasında olmalıdır');
  }

  // Sabitler
  const WATER_MOLECULAR_WEIGHT = 18.01528; // g/mol
  const DRY_AIR_MOLECULAR_WEIGHT = 28.9645; // g/mol
  const RATIO = WATER_MOLECULAR_WEIGHT / DRY_AIR_MOLECULAR_WEIGHT; // 0.62198

  // Doyma buhar basıncını hesapla (kPa)
  const calculateSaturationPressure = (temp: number): number => {
    if (temp >= 0) {
      // Su üzerinde (0°C ve üzeri)
      const C1 = -5.6745359e3;
      const C2 = 6.3925247;
      const C3 = -9.677843e-3;
      const C4 = 6.2215701e-7;
      const C5 = 2.0747825e-9;
      const C6 = -9.484024e-13;
      const C7 = 4.1635019;
      const T = temp + 273.15; // Kelvin'e çevir
      
      const lnPws = C1/T + C2 + C3*T + C4*T*T + C5*T*T*T + C6*T*T*T*T + C7*Math.log(T);
      return Math.exp(lnPws) / 1000; // Pa'dan kPa'ya çevir
    } else {
      // Buz üzerinde (0°C altı)
      const C1 = -5.6745359e3;
      const C2 = 6.3925247;
      const C3 = -9.677843e-3;
      const C4 = 6.2215701e-7;
      const C5 = 2.0747825e-9;
      const C6 = -9.484024e-13;
      const C7 = 4.1635019;
      const T = temp + 273.15; // Kelvin'e çevir
      
      const lnPws = C1/T + C2 + C3*T + C4*T*T + C5*T*T*T + C6*T*T*T*T + C7*Math.log(T);
      return Math.exp(lnPws) / 1000; // Pa'dan kPa'ya çevir
    }
  };

  // Psikrometrik sabit hesapla
  const calculatePsychrometricConstant = (pressure: number): number => {
    return 0.000665 * pressure; // 1/°C
  };

  // İteratif çözüm için başlangıç tahmini
  let wetBulbTemp = dryBulbTemp * 0.7; // Başlangıç tahmini
  const tolerance = 0.001; // °C
  const maxIterations = 100;
  let iteration = 0;

  // Newton-Raphson yöntemi ile iteratif çözüm
  while (iteration < maxIterations) {
    const pws_wb = calculateSaturationPressure(wetBulbTemp);
    const pws_db = calculateSaturationPressure(dryBulbTemp);
    const pw = (relativeHumidity / 100) * pws_db;
    const A = calculatePsychrometricConstant(pressure);
    
    // Psikrometrik denklem: pw = pws_wb - A * P * (Tdb - Twb)
    const f = pws_wb - A * pressure * (dryBulbTemp - wetBulbTemp) - pw;
    
    // Türev hesapla
    const dPws_dT = pws_wb * (2501.3 / ((wetBulbTemp + 273.15) * (wetBulbTemp + 273.15)));
    const df_dTwb = dPws_dT + A * pressure;
    
    // Newton-Raphson güncellemesi
    const deltaT = -f / df_dTwb;
    wetBulbTemp += deltaT;
    
    if (Math.abs(deltaT) < tolerance) {
      break;
    }
    
    iteration++;
  }

  // Yaş termometre sıcaklığı kuru termometre sıcaklığından yüksek olamaz
  if (wetBulbTemp > dryBulbTemp) {
    wetBulbTemp = dryBulbTemp;
  }

  return Number(wetBulbTemp.toFixed(1));
};

/**
 * Yardımcı fonksiyon: Basınçtan yükseklik hesaplama
 * @param pressure - Atmosferik basınç (kPa)
 * @returns Yaklaşık yükseklik (m)
 */
export const calculateElevationFromPressure = (pressure: number): number => {
  const SEA_LEVEL_PRESSURE = 101.325; // kPa
  // Barometrik formül
  return 44330 * (1 - Math.pow(pressure / SEA_LEVEL_PRESSURE, 0.1903));
};
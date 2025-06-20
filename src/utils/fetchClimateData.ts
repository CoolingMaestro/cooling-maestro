import { message, Modal } from "antd";
import { getCoordinates } from "./getCoordinates";
import { calculateWetBulbTemperature } from "./calculateWetBulbTemperature";
import { saveCoordinatesToDB } from "../services/coordinatesService";
import { solAirTemperatureService } from "../services/solAirTemperatureService";

interface ClimateDataParams {
  selectedProvince: string;
  selectedDistrict: string;
  setLoading: (loading: boolean) => void;
  setClimateData: (data: {
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
    designDayData?: any; // Tasarım günü saatlik verileri
  } | null) => void;
}

interface DailyLoadData {
  date: string;
  maxTemp: number;
  peakCoolingLoad: number;
  peakHour: number;
  conditions: {
    temperature: number;
    humidity: number;
    solarRadiation: number;
    windSpeed: number;
  };
}

export const fetchClimateData = async ({
  selectedProvince,
  selectedDistrict,
  setLoading,
  setClimateData,
}: ClimateDataParams) => {
  if (!selectedProvince || !selectedDistrict) return;
  setLoading(true);
  try {
    // Koordinatları al
    const coordinates = await getCoordinates(selectedProvince, selectedDistrict);
    
    // Koordinatları veritabanına kaydet
    await saveCoordinatesToDB(selectedProvince, coordinates, selectedDistrict);
    console.log(`Koordinatlar veritabanına kaydedildi: ${selectedDistrict}, ${selectedProvince}`);

    // ASHRAE önerisi: 10 yıllık veri (minimum 5 yıl)
    const yearsOfData = 10;
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const startDate = new Date(today.getFullYear() - yearsOfData, today.getMonth(), today.getDate());

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // İlk olarak günlük maksimum değerleri al (hızlı ön filtreleme için)
    const dailyResponse = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${coordinates.lat}&longitude=${coordinates.lng}` +
      `&start_date=${startDateStr}&end_date=${endDateStr}` +
      `&daily=temperature_2m_max,relative_humidity_2m_mean,soil_temperature_0_to_7cm_mean,` +
      `surface_pressure_mean,shortwave_radiation_sum` +
      `&timezone=Europe/Istanbul`
    );

    if (!dailyResponse.ok) {
      throw new Error(`API call failed: ${dailyResponse.status}`);
    }

    const dailyData = await dailyResponse.json();

    // En sıcak 20 günü belirle (ASHRAE: En sıcak günler arasından seç)
    const daysWithData = dailyData.daily.time.map((date: string, index: number) => ({
      date,
      temperature: dailyData.daily.temperature_2m_max[index],
      humidity: dailyData.daily.relative_humidity_2m_mean[index],
      radiation: dailyData.daily.shortwave_radiation_sum[index],
      groundTemp: dailyData.daily.soil_temperature_0_to_7cm_mean[index],
      pressure: dailyData.daily.surface_pressure_mean?.[index],
    })).filter((day: any) => day.temperature !== null);

    // Sıcaklığa göre sırala ve en sıcak 20 günü al
    const hottestDays = [...daysWithData]
      .sort((a, b) => b.temperature - a.temperature)
      .slice(0, 20);

    // En sıcak 20 gün için saatlik veri al ve gerçek soğutma yüklerini hesapla
    const candidateLoads: DailyLoadData[] = [];

    for (const day of hottestDays) {
      try {
        // O gün için saatlik veri al
        const hourlyResponse = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?` +
          `latitude=${coordinates.lat}&longitude=${coordinates.lng}` +
          `&start_date=${day.date}&end_date=${day.date}` +
          `&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,` +
          `direct_radiation,diffuse_radiation,direct_normal_irradiance,` +
          `shortwave_radiation` +
          `&timezone=Europe/Istanbul`
        );

        if (!hourlyResponse.ok) continue;

        const hourlyData = await hourlyResponse.json();

        // Her saat için basitleştirilmiş soğutma yükü skoru hesapla
        let maxHourlyLoad = 0;
        let peakHour = 0;

        for (let hour = 0; hour < 24; hour++) {
          const temp = hourlyData.hourly.temperature_2m[hour];
          const radiation = hourlyData.hourly.shortwave_radiation[hour] || 0;
          const windSpeed = hourlyData.hourly.windspeed_10m[hour] || 3;

          // Basitleştirilmiş sol-air sıcaklık hesabı (güney duvar için)
          const solAirTemp = solAirTemperatureService.calculateSolAirTemperature({
            outdoorTemp: temp,
            solarRadiation: radiation,
            surfaceAbsorptance: 0.7, // Tipik değer
            windSpeed: windSpeed,
            surfaceType: 'vertical'
          });

          // Basitleştirilmiş yük skoru (gerçek hesaplama daha karmaşık)
          // İç sıcaklık 24°C varsayımı ile
          const loadScore = Math.max(0, solAirTemp - 24);

          if (loadScore > maxHourlyLoad) {
            maxHourlyLoad = loadScore;
            peakHour = hour;
          }
        }

        candidateLoads.push({
          date: day.date,
          maxTemp: day.temperature,
          peakCoolingLoad: maxHourlyLoad,
          peakHour: peakHour,
          conditions: {
            temperature: hourlyData.hourly.temperature_2m[peakHour],
            humidity: hourlyData.hourly.relative_humidity_2m[peakHour],
            solarRadiation: hourlyData.hourly.shortwave_radiation[peakHour],
            windSpeed: hourlyData.hourly.windspeed_10m[peakHour]
          }
        });

      } catch (error) {
        console.error(`Error fetching hourly data for ${day.date}:`, error);
      }
    }

    // En yüksek soğutma yüküne sahip günü seç
    candidateLoads.sort((a, b) => b.peakCoolingLoad - a.peakCoolingLoad);

    // ASHRAE %1 tasarım günü (yılda 3-4 gün aşılır)
    const designDayIndex = Math.min(
      Math.floor(candidateLoads.length * 0.01),
      candidateLoads.length - 1
    );

    const designDay = candidateLoads[designDayIndex] || candidateLoads[0];

    // Seçilen tasarım günü için detaylı saatlik veriyi tekrar al
    const designDayResponse = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${coordinates.lat}&longitude=${coordinates.lng}` +
      `&start_date=${designDay.date}&end_date=${designDay.date}` +
      `&hourly=temperature_2m,relative_humidity_2m,windspeed_10m,` +
      `direct_radiation,diffuse_radiation,direct_normal_irradiance,` +
      `shortwave_radiation,surface_pressure` +
      `&timezone=Europe/Istanbul`
    );

    const designDayHourlyData = await designDayResponse.json();

    // Tasarım günündeki pik saatteki değerleri al
    const peakHourIndex = designDay.peakHour;
    const maxTemp = designDay.maxTemp;
    const humidity = designDayHourlyData.hourly.relative_humidity_2m[peakHourIndex];
    const pressure = designDayHourlyData.hourly.surface_pressure?.[peakHourIndex];
    const elevation = dailyData.elevation || null;

    // Basınç hPa'dan kPa'ya çevir
    const pressureInKPa = pressure ? pressure / 10 : 101.325;

    // Toprak sıcaklığını tasarım gününden al
    const designDayIndex2 = dailyData.daily.time.indexOf(designDay.date);
    const groundTemp = dailyData.daily.soil_temperature_0_to_7cm_mean[designDayIndex2] || 15;

    // Pik saatteki güneş ve rüzgar verilerini al
    const solarRadiation = designDayHourlyData.hourly.shortwave_radiation?.[peakHourIndex] || 0;
    const windSpeed = designDayHourlyData.hourly.windspeed_10m?.[peakHourIndex] || 0;
    const directRadiation = designDayHourlyData.hourly.direct_radiation?.[peakHourIndex] || 0;
    const diffuseRadiation = designDayHourlyData.hourly.diffuse_radiation?.[peakHourIndex] || 0;

    setClimateData({
      maxTemp: maxTemp,
      maxTempDate: designDay.date,
      humidity: humidity,
      wetBulbTemp: calculateWetBulbTemperature(maxTemp, humidity, pressureInKPa),
      groundTemp: groundTemp,
      pressure: pressure ? Math.round(pressure) : null,
      elevation: elevation !== null ? Math.round(elevation) : null,
      solarRadiation: Math.round(solarRadiation),
      windSpeed: windSpeed.toFixed(1),
      directRadiation: Math.round(directRadiation),
      diffuseRadiation: Math.round(diffuseRadiation),
      peakHour: designDay.peakHour,
      designDayData: designDayHourlyData // Saatlik veriyi sakla
    });

    // Başarılı mesaj
    message.success(
      `ASHRAE standardına göre tasarım günü: ${designDay.date}. ` +
      `En yüksek soğutma yükü saat ${designDay.peakHour}:00'da. ` +
      `Sıcaklık: ${maxTemp.toFixed(1)}°C`
    );

  } catch (error) {
    console.error("Error fetching climate data:", error);
    Modal.error({
      title: "İklim Verileri Alınamadı",
      content: `Hata: ${error instanceof Error ? error.message : "Bilinmeyen hata"}. Lütfen tekrar deneyin.`,
    });
  } finally {
    setLoading(false);
  }
};
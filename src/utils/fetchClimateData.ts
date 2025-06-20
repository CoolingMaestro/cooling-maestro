import { message, Modal } from "antd";
import { getCoordinates } from "./getCoordinates";
import { calculateWetBulbTemperature } from "./calculateWetBulbTemperature";
import { saveCoordinatesToDB } from "../services/coordinatesService";

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
  } | null) => void;
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
    // Get coordinates for the selected location (you'll need to implement this)
    const coordinates = await getCoordinates(
      selectedProvince,
      selectedDistrict
    );

    // Koordinatları veritabanına kaydet (Open-Meteo API çağrısından önce)
    await saveCoordinatesToDB(selectedProvince, coordinates, selectedDistrict);
    console.log(`Koordinatlar veritabanına kaydedildi: ${selectedDistrict}, ${selectedProvince}`);

    // Son 5 yılın tarih aralığını hesapla
    const today = new Date();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 1
    ); // Dün
    const startDate = new Date(
      today.getFullYear() - 5,
      today.getMonth(),
      today.getDate()
    ); // 5 yıl önce

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // OpenMeteo API call - Son 5 yıllık veri (o tarihe ait tüm iklim verileri)
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${coordinates.lat}&longitude=${coordinates.lng}&start_date=${startDateStr}&end_date=${endDateStr}&daily=soil_temperature_0_to_7cm_mean,relative_humidity_2m_mean,temperature_2m_max,surface_pressure_mean&timezone=Europe/Istanbul`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Hata kontrolü - API'den dönen veri yapısını kontrol et
    if (
      !data.daily ||
      !data.daily.temperature_2m_max ||
      data.daily.temperature_2m_max.length === 0
    ) {
      throw new Error("Invalid data structure from API or no data available");
    }

    // Rakım bilgisini al (API otomatik olarak sağlar)
    const elevation = data.elevation || null;

    // Son 5 yıl içerisindeki en yüksek sıcaklığı ve o tarihin index'ini bul
    const temperatures = data.daily.temperature_2m_max.filter(
      (temp: number | null | undefined) => temp !== null && temp !== undefined
    );
    const maxTemp = Math.max(...temperatures);
    const maxTempIndex = data.daily.temperature_2m_max.indexOf(maxTemp);

    if (maxTempIndex === -1) {
      throw new Error("Could not find maximum temperature in data");
    }

    // En yüksek sıcaklığın yaşandığı tarihin tüm iklim verilerini al
    const maxTempDate = data.daily.time[maxTempIndex];
    const humidityOnMaxTempDay =
      data.daily.relative_humidity_2m_mean[maxTempIndex];
    const groundTempOnMaxTempDay =
      data.daily.soil_temperature_0_to_7cm_mean[maxTempIndex];
    const pressureOnMaxTempDay = data.daily.surface_pressure_mean
      ? data.daily.surface_pressure_mean[maxTempIndex]
      : null;

    // Eksik verileri kontrol et ve default değerler ata
    const finalHumidity =
      humidityOnMaxTempDay !== null && humidityOnMaxTempDay !== undefined
        ? humidityOnMaxTempDay
        : 50;
    const finalGroundTemp =
      groundTempOnMaxTempDay !== null && groundTempOnMaxTempDay !== undefined
        ? groundTempOnMaxTempDay
        : 15;
    const finalPressure =
      pressureOnMaxTempDay !== null && pressureOnMaxTempDay !== undefined
        ? Math.round(pressureOnMaxTempDay)
        : null;

    // Basınç değeri hPa'dan kPa'ya çevir (Open-Meteo hPa döndürür)
    const pressureInKPa = finalPressure !== null ? finalPressure / 10 : 101.325;
    
    setClimateData({
      maxTemp: maxTemp,
      maxTempDate: maxTempDate,
      humidity: finalHumidity,
      wetBulbTemp: calculateWetBulbTemperature(maxTemp, finalHumidity, pressureInKPa),
      groundTemp: finalGroundTemp,
      pressure: finalPressure,
      elevation: elevation !== null ? Math.round(elevation) : null,
    });

    // Başarılı mesaj - hangi tarihe ait veriler alındığını belirt
    message.success(
      `${maxTempDate} tarihindeki iklim verileri alındı. En yüksek sıcaklık: ${maxTemp}°C`
    );
  } catch (error) {
    console.error("Error fetching climate data:", error);
    // Kullanıcıya hata mesajı göster
    Modal.error({
      title: "İklim Verileri Alınamadı",
      content: `Hata: ${
        error instanceof Error ? error.message : "Bilinmeyen hata"
      }. Lütfen tekrar deneyin.`,
    });
  } finally {
    setLoading(false);
  }
};
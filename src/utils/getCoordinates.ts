import { message } from "antd";
import { getCoordinatesFromDB, saveCoordinatesToDB } from "../services/coordinatesService";

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number }>();

export const getCoordinates = async (province: string, district: string) => {
  try {
    // Check cache first
    const cacheKey = `${district}-${province}`;
    if (geocodeCache.has(cacheKey)) {
      console.log(`Koordinatlar önbellekten alındı (${district}, ${province})`);
      return geocodeCache.get(cacheKey)!;
    }

    // Check database first
    console.log(`Veritabanında aranıyor: ${district}, ${province}`);
    const dbCoordinates = await getCoordinatesFromDB(province, district);
    if (dbCoordinates) {
      console.log(`Koordinatlar veritabanından alındı (${district}, ${province}):`, dbCoordinates);
      geocodeCache.set(cacheKey, dbCoordinates);
      return dbCoordinates;
    }


    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const searchQuery = `${district}, ${province}, Turkey`;
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      searchQuery
    )}&limit=1`;
    
    console.log('Photon API isteği yapılıyor:');
    console.log('URL:', photonUrl);
    console.log('Search Query:', searchQuery);
    
    const response = await fetch(photonUrl);

    if (!response.ok) {
      throw new Error("Koordinatlar alınamadı");
    }

    const data = await response.json();

    if (data && data.features && data.features.length > 0) {
      const coordinates = {
        lat: data.features[0].geometry.coordinates[1],
        lng: data.features[0].geometry.coordinates[0],
      };
      console.log(`Koordinatlar bulundu (${district}, ${province}):`, coordinates);
      // Cache the result
      geocodeCache.set(cacheKey, coordinates);
      // Save to database
      await saveCoordinatesToDB(province, coordinates, district);
      return coordinates;
    }

    // If district search fails, try province only
    // Rate limiting for second request
    const now2 = Date.now();
    const timeSinceLastRequest2 = now2 - lastRequestTime;
    if (timeSinceLastRequest2 < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest2));
    }
    lastRequestTime = Date.now();

    const provinceSearchQuery = `${province}, Turkey`;
    const provincePhotonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      provinceSearchQuery
    )}&limit=1`;
    
    console.log('Photon API isteği yapılıyor (sadece il):');
    console.log('URL:', provincePhotonUrl);
    console.log('Search Query:', provinceSearchQuery);
    
    const provinceResponse = await fetch(provincePhotonUrl);

    if (!provinceResponse.ok) {
      throw new Error("Koordinatlar alınamadı");
    }

    const provinceData = await provinceResponse.json();

    if (provinceData && provinceData.features && provinceData.features.length > 0) {
      const coordinates = {
        lat: provinceData.features[0].geometry.coordinates[1],
        lng: provinceData.features[0].geometry.coordinates[0],
      };
      console.log(`Koordinatlar bulundu (sadece il - ${province}):`, coordinates);
      // Cache the result with province-only key
      geocodeCache.set(province, coordinates);
      // Save to database (province only)
      await saveCoordinatesToDB(province, coordinates);
      return coordinates;
    }

    throw new Error("Koordinatlar bulunamadı");
  } catch (error) {
    console.error("Koordinat alma hatası:", error);
    message.warning(
      "Koordinatlar alınamadı. Varsayılan değerler kullanılacak."
    );
    // Return Ankara's coordinates as default
    const fallbackCoordinates = { lat: 39.9334, lng: 32.8597 };
    console.log("Varsayılan koordinatlar kullanılıyor (Ankara):", fallbackCoordinates);
    return fallbackCoordinates;
  }
};
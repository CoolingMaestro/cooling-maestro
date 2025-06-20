import { supabase } from '../lib/supabase';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TurkeyCoordinates {
  id?: number;
  province: string;
  district: string | null;
  latitude: number;
  longitude: number;
  created_at?: string;
  updated_at?: string;
}

// Veritabanından koordinat getir
export const getCoordinatesFromDB = async (
  province: string,
  district?: string
): Promise<Coordinates | null> => {
  try {
    let query = supabase
      .from('turkey_coordinates')
      .select('latitude, longitude')
      .eq('province', province);

    if (district) {
      query = query.eq('district', district);
    } else {
      query = query.is('district', null);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    return {
      lat: parseFloat(data.latitude),
      lng: parseFloat(data.longitude),
    };
  } catch (error) {
    console.error('Veritabanından koordinat getirme hatası:', error);
    return null;
  }
};

// Koordinatı veritabanına kaydet
export const saveCoordinatesToDB = async (
  province: string,
  coordinates: Coordinates,
  district?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('turkey_coordinates').upsert({
      province,
      district: district || null,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'province,district',
    });

    if (error) {
      console.error('Koordinat kaydetme hatası:', error);
      return false;
    }

    console.log(`Koordinatlar veritabanına kaydedildi (${district ? `${district}, ` : ''}${province})`);
    return true;
  } catch (error) {
    console.error('Koordinat kaydetme hatası:', error);
    return false;
  }
};
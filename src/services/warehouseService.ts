import { supabase } from '../lib/supabase';

export interface WarehouseType {
  id: number;
  type_code: string;
  type_name: string;
  description: string | null;
  icon_name: string | null;
  default_temperature: number;
  temp_range_min: number;
  temp_range_max: number;
  default_humidity: number | null;
  humidity_range_min: number | null;
  humidity_range_max: number | null;
  air_change_rate: number | null;
  recommended_velocity: number | null;
  display_order: number | null;
  is_active: boolean | null;
}

export const warehouseService = {
  async getWarehouseTypes(): Promise<{ data: WarehouseType[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('warehouse_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching warehouse types:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error };
    }
  },

  async getWarehouseTypeByCode(typeCode: string): Promise<{ data: WarehouseType | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('warehouse_types')
        .select('*')
        .eq('type_code', typeCode)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching warehouse type:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error };
    }
  }
};
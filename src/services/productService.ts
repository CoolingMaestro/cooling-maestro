import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/postgrest-js';

export interface ProductThermalProperty {
  id: number;
  product_name: string;
  category: string;
  freezing_point: number | null;
  specific_heat_above_freezing: number;
  specific_heat_below_freezing: number | null;
  latent_heat_fusion: number | null;
  water_content: number | null;
  density_above_freezing: number | null;
  density_below_freezing: number | null;
  respiration_rate: number | null;
  respiration_rate_20c: number | null;
  q10_value: number | null;
  moisture_loss_rate: number | null;
  data_source: string | null;
  notes: string | null;
  is_active: boolean | null;
  optimal_storage_temp_min: number | null;
  optimal_storage_temp_max: number | null;
  optimal_humidity_min: number | null;
  optimal_humidity_max: number | null;
}

export const productService = {
  async getProductCategories(): Promise<{ data: string[] | null; error: PostgrestError | Error | null }> {
    try {
      const { data, error } = await supabase
        .from('product_thermal_properties')
        .select('category')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching product categories:', error);
        return { data: null, error };
      }

      // Get unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      
      return { data: uniqueCategories, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  async getProductsByCategory(category: string): Promise<{ data: ProductThermalProperty[] | null; error: PostgrestError | Error | null }> {
    try {
      const { data, error } = await supabase
        .from('product_thermal_properties')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('product_name', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  async getProductByName(productName: string): Promise<{ data: ProductThermalProperty | null; error: PostgrestError | Error | null }> {
    try {
      const { data, error } = await supabase
        .from('product_thermal_properties')
        .select('*')
        .eq('product_name', productName)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
};
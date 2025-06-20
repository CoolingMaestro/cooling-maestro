import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/postgrest-js';

export interface InsulationType {
  id: number;
  name: string;
  category: string;
  u_value: number;
  thickness: number | null;
  description: string | null;
}

export const insulationService = {
  async getInsulationTypes(): Promise<{ data: InsulationType[] | null; error: PostgrestError | Error | null }> {
    try {
      const { data, error } = await supabase
        .from('insulation_types')
        .select('*')
        .filter('surface', 'eq', 'wall')
        .order('category', { ascending: true })
        .order('thickness', { ascending: true });

      if (error) {
        console.error('Error fetching insulation types:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  },

  async getDoorInsulationTypes(): Promise<{ data: InsulationType[] | null; error: PostgrestError | Error | null }> {
    try {
      const { data, error } = await supabase
        .from('insulation_types')
        .select('*')
        .filter('surface', 'eq', 'door')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching door insulation types:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
};
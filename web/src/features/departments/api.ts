import { supabase, toFriendlyError } from '@/lib/supabase';
import type { DepartmentRow } from '@/lib/database.types';
import type { Department } from './types';

export async function fetchDepartments(): Promise<Department[]> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('university', 'NED')
      .order('name');

    if (error) throw error;
    return ((data ?? []) as DepartmentRow[]).map((d) => ({ id: d.id, name: d.name }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

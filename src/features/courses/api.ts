import { supabase, toFriendlyError } from '@/lib/supabase';
import type { Course } from './types';

interface RawCourseRow {
  id: string;
  code: string | null;
  name: string;
  department_id: string | null;
  departments: { name: string } | null;
}

function isMissingSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /does not exist|column .* does not exist|relationship .* could not be found|schema cache/i.test(
    message,
  );
}

export async function fetchCourses(departmentId?: string): Promise<Course[]> {
  try {
    let query = supabase
      .from('courses')
      .select('id, code, name, department_id, departments(name)')
      .eq('university', 'NED')
      .order('name');
    if (departmentId) query = query.eq('department_id', departmentId);

    const { data, error } = await query;
    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }

    return ((data ?? []) as unknown as RawCourseRow[]).map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      departmentId: course.department_id,
      department: course.departments?.name ?? null,
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface Course {
  id: string;
  code: string | null;
  name: string;
  departmentId: string | null;
  department: string | null;
}

export function formatCourse(course: Pick<Course, 'code' | 'name'>): string {
  return course.code ? `${course.code} - ${course.name}` : course.name;
}

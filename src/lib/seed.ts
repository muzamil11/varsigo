// One-time script to populate NED University reference data: the 6 core
// departments. Teacher arrays are intentionally empty — teachers are now
// added through the app itself (Admin → Teachers, or a user's "Suggest a
// Teacher" flow), not seeded fake data. Add names to an array below only if
// you want this script to also seed specific teachers for that department.
//
// Idempotent: every insert is an upsert keyed on a unique index (see
// supabase/schema.sql's idx_departments_name_university and
// idx_teachers_name_department), so re-running this is always safe.
//
// HOW TO RUN
//   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local — from the Supabase
//      dashboard: Settings → API → "service_role" secret key (NOT the anon
//      key). The service role key bypasses Row Level Security, which is
//      required here since departments only allow public *reads*
//      (see supabase/schema.sql) — only an admin/service key can seed them.
//   2. npm run seed
//
// This file is never imported by the app itself (no screen references it),
// and the service role key is read only by this Node script via dotenv —
// it is never bundled into the client, unlike EXPO_PUBLIC_* variables.

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || supabaseUrl === 'your_supabase_url') {
  console.error(
    'Missing (or still-placeholder) EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in ' +
      '.env.local. See the setup comment at the top of src/lib/seed.ts.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const DEPARTMENTS: Record<string, string[]> = {};

async function seed() {
  console.log('Seeding NED departments…\n');

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .upsert(
      Object.keys(DEPARTMENTS).map((name) => ({ name, university: 'NED' })),
      { onConflict: 'name,university', ignoreDuplicates: false },
    )
    .select('id, name');
  if (deptError) throw deptError;

  for (const dept of departments ?? []) {
    console.log(`✓ department: ${dept.name}`);
  }

  for (const [departmentName, teacherNames] of Object.entries(DEPARTMENTS)) {
    if (teacherNames.length === 0) continue;

    const department = departments?.find((d) => d.name === departmentName);
    if (!department) continue;

    const { error: teacherError } = await supabase.from('teachers').upsert(
      teacherNames.map((name) => ({ name, department_id: department.id, university: 'NED' })),
      { onConflict: 'name,department_id', ignoreDuplicates: false },
    );
    if (teacherError) throw teacherError;
    console.log(`✓ ${teacherNames.length} teacher(s) for ${departmentName}`);
  }

  console.log('\nDone.');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

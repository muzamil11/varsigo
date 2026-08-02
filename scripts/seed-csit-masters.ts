import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const DEPARTMENT = 'Computer Science & IT';

const COURSE_NAMES: Record<string, string> = {
  'CT-491': 'Operating System',
  'CT-492': 'Object Oriented Programming',
  'CT-493': 'Data Structure and Algorithm Design',
  'CT-494': 'Introduction to Databases',
  'CT-501': 'Software Project Management',
  'CT-504': 'Advanced Numerical Analysis',
  'CT-506': 'Advanced Analysis of Algorithms',
  'CT-509': 'Data Science',
  'CT-512': 'Principles of Marketing',
  'CT-527': 'Image Processing & Computer Vision',
  'CT-528': 'Advanced Database Techniques',
  'CT-530': 'Data Mining',
  'CT-532': 'Information System Audit',
  'CT-534': 'Software Quality Assurance',
  'CT-539': 'Advanced Computer Networking',
  'CT-542': 'Information Security Management',
  'CT-544': 'Cloud Computing Security',
  'CT-545': 'Digital Forensics',
  'CT-554': 'Ethical Hacking',
  'CT-555': 'Cloud Computing',
  'CT-556': 'Information Design',
  'CT-559': 'Artificial Neural Networks',
  'CT-560': 'Deep Learning',
  'CT-561': 'Natural Language Processing',
  'CT-562': 'Machine Learning',
  'CT-563': 'Business Intelligence',
  'CT-574': 'Image Processing Systems',
  'CT-575': 'Cryptography',
  'CT-576': 'Advanced Operating Systems',
  'CT-577': 'Advanced Theory of Automata',
  'CT-581': 'Social, Professional & Digital Society',
  'CT-583': 'Tools & Techniques for Data Science',
  'CT-590': 'Data Visualization',
  'CT-592': 'Big Data Analytics',
  'CT-597': 'Tools & Techniques for Security Analysis and Forensics',
  'CT-598': 'Forensic Data Analysis',
  'CT-5003': 'Advanced Programming',
  'CT-5007': 'Web GIS',
  'CT-5013': 'Generative AI',
  'CT-5015': 'Governance, Risk and Compliance',
};

const TEACHER_COURSES: { teacher: string; code: string }[] = [
  { teacher: 'Dr. Muhammad Hassan Nasir', code: 'CT-556' },
  { teacher: 'Prof. Dr. Muhammad Mubashir Khan', code: 'CT-575' },
  { teacher: 'Dr. Mirza Mahmood Baig', code: 'CT-504' },
  { teacher: 'Ms. Mahawish', code: 'CT-539' },
  { teacher: 'Dr. Maria Andleeb Siddiqui', code: 'CT-592' },
  { teacher: 'Dr. Sohail A. Sattar', code: 'CT-530' },
  { teacher: 'Mr. Naushad Siddiqui', code: 'CT-544' },
  { teacher: 'Mr. Navaid Naqvi', code: 'CT-542' },
  { teacher: 'Dr. Syed Saood Zia', code: 'CT-528' },
  { teacher: 'Dr. Shehnila Zardari', code: 'CT-501' },
  { teacher: 'Dr. Muhammad Kamran', code: 'CT-504' },
  { teacher: 'Mr. Farhan Ahmed Bhutto', code: 'CT-554' },
  { teacher: 'Mr. Adnan Ahmed', code: 'CT-527' },
  { teacher: 'Dr. Shariq Mahmood Khan', code: 'CT-539' },
  { teacher: 'Dr. Muhammad Umer Farooq', code: 'CT-592' },
  { teacher: 'Mr. Muhammad Sarim Khan', code: 'CT-532' },
  { teacher: 'Dr. Muhammad Naseem', code: 'CT-509' },
  { teacher: 'Dr. Usman Amjad', code: 'CT-506' },
  { teacher: 'Mr. Basit Jasani', code: 'CT-506' },
  { teacher: 'Dr. Erum Abbasi', code: 'CT-583' },
  { teacher: 'Mr. Ali Najmuddin', code: 'CT-590' },
  { teacher: 'Mr. Muhammad Umair Baig', code: 'CT-561' },
  { teacher: 'Dr. Muhammad Uzair Yousuf', code: 'CT-597' },
  { teacher: 'Mr. Imran Mujtaba', code: 'CT-563' },
  { teacher: 'Dr. Muhammad Imran', code: 'CT-530' },
  { teacher: 'Mr. Wajahat Hussain', code: 'CT-598' },
  { teacher: 'Dr. Abdul Karim Kazi', code: 'CT-577' },
  { teacher: 'Ms. Shumaila Moin', code: 'CT-491' },
  { teacher: 'Dr. Humma Nargis', code: 'CT-534' },
  { teacher: 'Dr. Muhammad Ahmed', code: 'CT-5003' },
  { teacher: 'Mr. Ahsan Ahmed Farooqui', code: 'CT-5015' },
  { teacher: 'Mr. Muhammad Sohail', code: 'CT-574' },
  { teacher: 'Dr. Muhammad Najmul Islam Farooqi', code: 'CT-509' },
  { teacher: 'Ms. Mehar Fatima', code: 'CT-562' },
  { teacher: 'Dr. Syed Abbas Ali', code: 'CT-559' },
  { teacher: 'Dr. Syed Tauqeer Ahmed Hashmi', code: 'CT-581' },
  { teacher: 'Ms. Yumna Shahzad', code: 'CT-512' },
  { teacher: 'Ms. Saadia Arshad', code: 'CT-574' },
  { teacher: 'Dr. Khalid', code: 'CT-583' },
  { teacher: 'Dr. Danish Jamil', code: 'CT-592' },
  { teacher: 'Dr. Najeed A. Khan', code: 'CT-562' },
  { teacher: 'Mr. Ubaid Jaffery', code: 'CT-545' },
  { teacher: 'Dr. Tabassum Waheed', code: 'CT-576' },
  { teacher: 'Mr. Ehtisham', code: 'CT-555' },
  { teacher: 'Dr. Waseemullah', code: 'CT-560' },
  { teacher: 'Dr. Syed Abbas Ali', code: 'CT-561' },
  { teacher: 'Dr. Raheela Asif', code: 'CT-530' },
  { teacher: 'Mr. Syed Muhammad Faraz', code: 'CT-492' },
  { teacher: 'Mr. Muhammad Umair Baig', code: 'CT-5013' },
  { teacher: 'Mr. Naeem Ahmed Memon', code: 'CT-494' },
  { teacher: 'Dr. Mohammad Affan Alim', code: 'CT-561' },
  { teacher: 'Mr. Sohail Ahmed', code: 'CT-504' },
  { teacher: 'Mr. Sajid Majeed', code: 'CT-5007' },
  { teacher: 'Dr. Muhammad Faizan Shirazi', code: 'CT-560' },
  { teacher: 'Mr. Muhammad Wajih Uddin', code: 'CT-506' },
  { teacher: 'Mr. Syed Muhammad Faraz', code: 'CT-494' },
  { teacher: 'Mr. Naushad Siddiqui', code: 'CT-532' },
  { teacher: 'Dr. Haider Ali', code: 'CT-562' },
  { teacher: 'Dr. Muhammad Imran', code: 'CT-492' },
  { teacher: 'Dr. Najmi Ghani Haider', code: 'CT-501' },
  { teacher: 'Mr. Shahzaib Khan', code: 'CT-5013' },
  { teacher: 'Dr. Muhammad Faraz Hyder', code: 'CT-509' },
  { teacher: 'Dr. Danish Jamil', code: 'CT-583' },
  { teacher: 'Mr. Rohail Qamar', code: 'CT-493' },
  { teacher: 'Mr. Wajahat Hussain', code: 'CT-512' },
  { teacher: 'Mr. Farhan Ahmed Bhutto', code: 'CT-554' },
  { teacher: 'Mr. Ali Najmuddin', code: 'CT-590' },
  { teacher: 'Mr. Ahsan Ahmed Farooqui', code: 'CT-542' },
  { teacher: 'Mr. Adeel Saeed', code: 'CT-491' },
  { teacher: 'Mr. Zakir Hussain Khan', code: 'CT-581' },
  { teacher: 'Mr. Rohail Qamar', code: 'CT-530' },
  { teacher: 'Ms. Mahawish', code: 'CT-539' },
];

async function ensureDepartment() {
  const { data, error } = await supabase
    .from('departments')
    .upsert({ name: DEPARTMENT, university: 'NED' }, { onConflict: 'name,university' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function ensureCourse(departmentId: string, code: string) {
  const existing = await supabase
    .from('courses')
    .select('id')
    .eq('code', code)
    .eq('department_id', departmentId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id as string;

  const { data, error } = await supabase
    .from('courses')
    .insert({
      code,
      name: COURSE_NAMES[code] ?? code,
      department_id: departmentId,
      university: 'NED',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function ensureTeacher(departmentId: string, name: string) {
  const existing = await supabase
    .from('teachers')
    .select('id')
    .eq('name', name)
    .eq('department_id', departmentId)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id as string;

  const { data, error } = await supabase
    .from('teachers')
    .insert({
      name,
      department_id: departmentId,
      university: 'NED',
      verification_status: 'admin_verified',
      verified_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function seed() {
  const departmentId = await ensureDepartment();
  const courseIds = new Map<string, string>();
  const teacherIds = new Map<string, string>();

  for (const code of [...new Set(TEACHER_COURSES.map((item) => item.code))]) {
    courseIds.set(code, await ensureCourse(departmentId, code));
  }

  for (const name of [...new Set(TEACHER_COURSES.map((item) => item.teacher))]) {
    teacherIds.set(name, await ensureTeacher(departmentId, name));
  }

  const links = TEACHER_COURSES.map((item) => ({
    teacher_id: teacherIds.get(item.teacher),
    course_id: courseIds.get(item.code),
  })).filter((item): item is { teacher_id: string; course_id: string } =>
    Boolean(item.teacher_id && item.course_id),
  );

  const { error } = await supabase
    .from('teacher_courses')
    .upsert(links, { onConflict: 'teacher_id,course_id', ignoreDuplicates: true });
  if (error) throw error;

  console.log(`Department: ${DEPARTMENT}`);
  console.log(`Courses ensured: ${courseIds.size}`);
  console.log(`Teachers ensured: ${teacherIds.size}`);
  console.log(`Teacher-course links ensured: ${links.length}`);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

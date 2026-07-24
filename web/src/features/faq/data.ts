export type FaqCategory = 'Undergraduate' | 'Masters/PhD' | 'General / Office Info';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
}

export const FAQS: FaqItem[] = [
  // Undergraduate
  {
    id: 'ug1',
    category: 'Undergraduate',
    question: 'What is the NED entry test format?',
    answer:
      'The NED entry test is MCQ-based, covering Physics, Chemistry/CS, Mathematics and English. It is conducted in multiple phases before each academic year — check the official NED admissions portal for current dates.',
  },
  {
    id: 'ug2',
    category: 'Undergraduate',
    question: 'What is the minimum percentage required for undergraduate admission?',
    answer:
      'Generally 60% in HSC (Pre-Engineering/CS) is the eligibility baseline, but actual closing merit is much higher and varies by department and year — check the merit lists published after each test phase.',
  },
  {
    id: 'ug3',
    category: 'Undergraduate',
    question: 'How many credit hours are required to complete the degree?',
    answer:
      "Most BE/BS programs require around 136–145 credit hours spread across 8 semesters, with a typical course load of 16–20 credit hours per semester. Exact totals vary slightly by department — check your department's curriculum sheet.",
  },
  {
    id: 'ug4',
    category: 'Undergraduate',
    question: 'How is CGPA calculated and what is the minimum to stay enrolled?',
    answer:
      'NED uses a 4.0 scale. Each course grade maps to grade points (A = 4.0, B+ = 3.5, etc.), weighted by credit hours, and CGPA is the running weighted average across all semesters. Falling below the minimum CGPA threshold (typically 2.0) places a student on academic probation.',
  },
  {
    id: 'ug5',
    category: 'Undergraduate',
    question: 'What does degree completion require besides coursework?',
    answer:
      'Undergraduate degrees typically take 4 years (8 regular semesters) and require a Final Year Project (FYP) in the last two semesters, in addition to clearing all coursework and meeting the minimum CGPA requirement.',
  },

  // Masters/PhD
  {
    id: 'pg1',
    category: 'Masters/PhD',
    question: 'What is the admission eligibility for MS/PhD programs?',
    answer:
      'MS admission generally requires a BE/BS degree with a minimum CGPA (commonly 2.5, higher for competitive departments) plus a qualifying test score (e.g. NTS-GAT General/Subject). PhD admission additionally requires an MS degree and often an approved research proposal or supervisor consent.',
  },
  {
    id: 'pg2',
    category: 'Masters/PhD',
    question: 'What is the difference between thesis and coursework tracks?',
    answer:
      'The coursework track completes the degree through graded courses only. The thesis track replaces some coursework with independent research supervised by a faculty member, culminating in a written thesis and a defense — required for students planning to pursue a PhD later.',
  },
  {
    id: 'pg3',
    category: 'Masters/PhD',
    question: 'How is the semester structure organized for graduate programs?',
    answer:
      'MS programs are usually completed in 2–2.5 years via evening/weekend classes to accommodate working professionals, with 3 courses per semester being typical. PhD programs add comprehensive exams after coursework and a thesis defense at the end.',
  },

  // General / Office Info
  {
    id: 'gen1',
    category: 'General / Office Info',
    question: 'What is the attendance requirement?',
    answer:
      '75% attendance is mandatory to sit in the final exam. Falling short can result in being barred from the exam for that course.',
  },
  {
    id: 'gen2',
    category: 'General / Office Info',
    question: 'When are semester fees due and is there a late fine?',
    answer:
      'Fee vouchers are issued before each semester with a due date printed on them. Late payment incurs a per-day fine, and prolonged non-payment can block semester registration.',
  },
  {
    id: 'gen3',
    category: 'General / Office Info',
    question: 'Is there a point (bus) service for students?',
    answer:
      'Yes, NED runs point buses on major Karachi routes. Route lists and pass registration are handled at the transport office near the admin block at the start of each semester.',
  },
];

export const FAQ_CATEGORIES: readonly ('All' | FaqCategory)[] = [
  'All',
  'Undergraduate',
  'Masters/PhD',
  'General / Office Info',
];

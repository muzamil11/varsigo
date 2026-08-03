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
    id: 'ug6',
    category: 'Undergraduate',
    question: 'Where can I get the undergraduate admission form?',
    answer:
      'The undergraduate admission form is available on the NED Admission Web Portal at www.neduet.edu.pk/admission.',
  },
  {
    id: 'ug7',
    category: 'Undergraduate',
    question: 'Who is eligible to apply for undergraduate admission?',
    answer:
      'Applicants appearing in HSC-II or an equivalent examination in the admission year, and applicants who passed HSC-II or equivalent in the recent eligible years listed by NED, can apply. Always confirm the latest year limits from the current prospectus.',
  },
  {
    id: 'ug8',
    category: 'Undergraduate',
    question: 'Which intermediate groups can apply for NED undergraduate programmes?',
    answer:
      'Eligibility depends on the programme. Pre-Engineering, Pre-Medical, Computer Science, Commerce, Arts/Arts with Mathematics, and relevant DAE backgrounds may be eligible for different BE/BS programmes as described in Chapter 4 and Chapter 5 of the undergraduate prospectus.',
  },
  {
    id: 'ug9',
    category: 'Undergraduate',
    question: 'How is undergraduate merit calculated?',
    answer:
      'Merit score is calculated from 40% HSC Part-I/O-Level/equivalent marks and 60% NED entry test marks, subject to the current admission policy.',
  },
  {
    id: 'ug10',
    category: 'Undergraduate',
    question: 'Do Computer Science group students need an extra non-credit course?',
    answer:
      'Some admitted students may be required to qualify an additional non-credit course, such as Chemistry, in the first year Fall semester depending on their admitted programme and intermediate/equivalent group. NED may charge an additional fee for this course.',
  },
  {
    id: 'ug11',
    category: 'Undergraduate',
    question: 'Which marks should I enter if I am appearing in improvement or additional mathematics?',
    answer:
      'Enter the HSC/equivalent marks and year for the result that is complete and available by the last date of online admission application submission.',
  },
  {
    id: 'ug12',
    category: 'Undergraduate',
    question: 'What should I do if I cannot register on the admission portal?',
    answer:
      'Check whether the same email address or CNIC is already registered, and check the Junk/Spam folder for login information. If the issue remains, contact the admission portal helpdesk.',
  },
  {
    id: 'ug13',
    category: 'Undergraduate',
    question: 'What should I do if I cannot log in to the admission portal?',
    answer:
      'Enter the exact user ID and case-sensitive password. Also check common character confusion such as zero and O, L and I.',
  },
  {
    id: 'ug14',
    category: 'Undergraduate',
    question: 'What if I cannot upload my photograph on the admission portal?',
    answer:
      'Make sure your photograph follows the official guideline for application photographs provided by NED.',
  },
  {
    id: 'ug15',
    category: 'Undergraduate',
    question: 'How can I pay the undergraduate application fee?',
    answer:
      'Complete the online application form, print the transaction slip, and pay the indicated fee at a specified bank branch against the transaction ID shown on the slip.',
  },
  {
    id: 'ug16',
    category: 'Undergraduate',
    question: 'How do I get my pre-admission entry test admit card?',
    answer:
      'After bank fee confirmation, the admit card becomes available in the online admission portal if other requirements, especially the photograph, are accepted.',
  },
  {
    id: 'ug17',
    category: 'Undergraduate',
    question: 'What should I do after passing the pre-admission entry test?',
    answer:
      'Follow the official admission schedule and instructions published on the NED admission website at www.neduet.edu.pk/admission.',
  },
  {
    id: 'ug18',
    category: 'Undergraduate',
    question: 'Where do I submit the undergraduate admission form?',
    answer:
      'Print the admission form and annexures, get them signed where required, and submit them with the required documents to the NED Admission Office at the time of interview.',
  },
  {
    id: 'ug19',
    category: 'Undergraduate',
    question: 'Can I apply for an additional admission category?',
    answer:
      'Yes, you can apply for any additional category for which you are eligible during the initial online admission form submission, before the due date.',
  },
  {
    id: 'ug20',
    category: 'Undergraduate',
    question: 'Is there an extra fee for additional admission categories?',
    answer:
      'There is no extra fee for additional eligible categories except self-finance categories.',
  },
  {
    id: 'ug21',
    category: 'Undergraduate',
    question: 'What are the requirements for differently able candidates?',
    answer:
      'Candidates must meet the relevant HSC/equivalent requirements, have a disability certificate from the Department of Empowerment of Persons with Disabilities, Government of Sindh, and appear before the university medical board.',
  },
  {
    id: 'ug22',
    category: 'Undergraduate',
    question: 'What are the requirements for religious minority seats?',
    answer:
      'Applicants must be residents of Pakistan, belong to a religious minority, and meet the qualifying HSC/equivalent requirements recognized by the university.',
  },
  {
    id: 'ug23',
    category: 'Undergraduate',
    question: 'Are DAE holders eligible for undergraduate admission?',
    answer:
      'Relevant DAE holders may apply for reserved DAE categories if their diploma is from an institution recognized by SBTE, with the required minimum percentage and within the eligible recent years. Awaiting-result applicants are not eligible for this category.',
  },
  {
    id: 'ug24',
    category: 'Undergraduate',
    question: 'What are the passing marks in the NED entry test?',
    answer:
      'A minimum of 50% marks in the entry test is required to qualify for undergraduate admission.',
  },
  {
    id: 'ug25',
    category: 'Undergraduate',
    question: 'When is the NED entry test held and when is the result announced?',
    answer:
      'The entry test schedule is published on www.neduet.edu.pk/admission. The pre-admission entry test result is announced after the last session of the computer-based test and is made available on the NED website.',
  },
  {
    id: 'ug26',
    category: 'Undergraduate',
    question: 'How many times can a candidate appear in the entry test?',
    answer:
      'The pre-admission entry test is normally held twice. A candidate can appear in both tests by paying a separate fee for each attempt.',
  },
  {
    id: 'ug27',
    category: 'Undergraduate',
    question: 'Which entry test score is considered for admission?',
    answer:
      'If a candidate appears in both entry tests, the higher score is considered for admission.',
  },
  {
    id: 'ug28',
    category: 'Undergraduate',
    question: 'What type of pre-admission entry test does NED take?',
    answer:
      "The test is computer-based and consists of MCQs. It has four sections of 25 marks each, based on the applicant's HSC/equivalent group such as English, Mathematics, Physics, Chemistry, Biology, Computer Science, Accounting, Economics, Business Mathematics, or General Knowledge.",
  },
  {
    id: 'ug29',
    category: 'Undergraduate',
    question: 'When is the undergraduate merit list displayed?',
    answer:
      'Merit list dates are given in the official Admission Schedule available at www.neduet.edu.pk/admission.',
  },
  {
    id: 'ug30',
    category: 'Undergraduate',
    question: 'When do I have to pay self-finance fee?',
    answer:
      'Self-finance fee must be paid by the due date of online application form submission. Check the NED website for current updates.',
  },
  {
    id: 'ug31',
    category: 'Undergraduate',
    question: 'Is self-finance fee refundable if I get admission on a regular seat?',
    answer:
      'Yes. If you opt for admission on a regular seat, the total self-finance fee is refunded after submitting the self-finance refund form with the required documents.',
  },
  {
    id: 'ug32',
    category: 'Undergraduate',
    question: 'Does self-finance fee include admission fee?',
    answer:
      'No. Self-finance fee is paid once at the time of application submission. Admission fee must still be paid separately at the time of admission.',
  },
  {
    id: 'ug33',
    category: 'Undergraduate',
    question: 'What documents are required during the medical fitness test?',
    answer:
      'Bring the admission form along with all documents mentioned in the official document checklist.',
  },
  {
    id: 'ug34',
    category: 'Undergraduate',
    question: 'Can I pay the admission fee after taking admission?',
    answer:
      'No. Admission is not confirmed until the admission fee is paid on the interview/admission day. Payment may be made as allowed by the official instructions.',
  },
  {
    id: 'ug35',
    category: 'Undergraduate',
    question: 'Where are Architecture, Development Studies, and Biomedical Engineering classes held?',
    answer:
      'Bachelor of Architecture and BS Development Studies classes are held at City Campus near Govt. DJ Science College. Biomedical Engineering classes are held at LEJ Campus opposite Liaquat National Hospital.',
  },
  {
    id: 'ug36',
    category: 'Undergraduate',
    question: 'Is there a shuttle service for City Campus and LEJ Campus?',
    answer:
      'There is no specific shuttle bus service for these campuses, but some shuttle buses pass in front of them. Details are usually provided on orientation day.',
  },
  {
    id: 'ug37',
    category: 'Undergraduate',
    question: 'What is the duration of undergraduate degree programmes?',
    answer:
      'Most undergraduate programmes are four years long. Bachelor of Architecture is five years long.',
  },

  // General / Office Info
  {
    id: 'gen4',
    category: 'General / Office Info',
    question: 'What is the fee structure for issuance and verification of academic documents?',
    answer:
      'NED publishes document fees for degree, provisional certificate, transcript, marks sheet, duplicate documents, attestation, urgent processing, courier, and verification services. Check the Examinations FAQ or official fee notice for current amounts before payment.',
  },
  {
    id: 'gen5',
    category: 'General / Office Info',
    question: 'What are local and international courier charges?',
    answer:
      'Local and international courier charges are listed in the Examinations FAQ. Charges vary by destination and must be confirmed from the current official notice before applying.',
  },
  {
    id: 'gen6',
    category: 'General / Office Info',
    question: 'What is the process for degree loss or duplicate degree?',
    answer:
      'Download the degree form from the NED website and submit the required documents, which commonly include affidavit, undertaking, photocopy of original degree if available, CNIC/passport copy, newspaper advertisement about loss, and the prescribed fee.',
  },
  {
    id: 'gen7',
    category: 'General / Office Info',
    question: 'How do I dispatch academic documents such as degree, provisional certificate, or transcript?',
    answer:
      'Download the dispatch form from the NED website, follow the form instructions, attach required documents, and submit it to the Transcript Form section with the prescribed courier charges.',
  },
  {
    id: 'gen8',
    category: 'General / Office Info',
    question: 'How can I track my academic document dispatch?',
    answer:
      'Tracking numbers are usually shared by email after dispatch. For more information, contact the examination office dispatch section using the official contact details in the Examinations FAQ.',
  },
  {
    id: 'gen9',
    category: 'General / Office Info',
    question: 'What is the transcript processing time?',
    answer:
      'Transcript processing time depends on urgency: ordinary processing takes longer, while urgent and one-month options are faster. Check the current Examinations FAQ for exact working days.',
  },
  {
    id: 'gen10',
    category: 'General / Office Info',
    question: 'What is the degree issuance due date or processing time?',
    answer:
      'Degree processing time depends on ordinary or urgent processing and starts after document submission. Check the current Examinations FAQ for exact working days.',
  },
  {
    id: 'gen11',
    category: 'General / Office Info',
    question: 'What is the criteria for award of merit positions?',
    answer:
      'Merit positions are awarded in each discipline based on overall CGPA, subject to NED rules. Students with failed subjects, weak original batch status, or other ineligibility listed by the university may not qualify.',
  },
  {
    id: 'gen12',
    category: 'General / Office Info',
    question: 'How do I get national or overseas document verification?',
    answer:
      'For physical verification, send the request on official letterhead with copies of documents to be verified and the prescribed fee. For electronic verification, send scanned documents by email and pay the verification fee through the listed bank account.',
  },
  {
    id: 'gen13',
    category: 'General / Office Info',
    question: 'What is the process for online transcript or document verification?',
    answer:
      'Students can email the transcript issuance or document verification form with required documents and proof of payment to the official examination email addresses listed in the Examinations FAQ.',
  },
  {
    id: 'gen14',
    category: 'General / Office Info',
    question: 'Is urgent document verification available?',
    answer:
      'According to the Examinations FAQ, verification is not conducted on an urgent basis.',
  },
  {
    id: 'gen15',
    category: 'General / Office Info',
    question: 'Where can I find forms for academic documents?',
    answer:
      'Academic document forms are available from the Forms and Fees section of the NED website and the Examinations FAQ page.',
  },
  {
    id: 'gen16',
    category: 'General / Office Info',
    question: 'Is online payment available for academic documents?',
    answer:
      'The Examinations FAQ lists online payment methods such as payment gateway and bank transfer/challan options. Use the current official payment instructions before submitting any case.',
  },
  {
    id: 'gen17',
    category: 'General / Office Info',
    question: 'How do I apply for scrutiny of results?',
    answer:
      'Scrutiny applications are accepted only within the announced deadline after result declaration and with the prescribed fee mentioned on the scrutiny form.',
  },
];

export const FAQ_CATEGORIES: readonly ('All' | FaqCategory)[] = [
  'All',
  'Undergraduate',
  'General / Office Info',
];

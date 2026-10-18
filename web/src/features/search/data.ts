import type { FaqItem } from '@/features/faq/data';
import type { Paper } from '@/features/papers/data';
import type { QuestionListItem } from '@/features/questions/data';
import type { TeacherListItem } from '@/features/teachers/data';

export type SearchResultCategory = 'teacher' | 'paper' | 'faq' | 'question';

export interface SearchResult {
  category: SearchResultCategory;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export const SEARCH_CATEGORY_LABELS: Record<SearchResultCategory, string> = {
  teacher: 'Teachers',
  paper: 'Papers',
  faq: 'FAQ',
  question: 'Q&A',
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matches(haystack: string, query: string): boolean {
  return normalize(haystack).includes(normalize(query));
}

/** Teachers aren't linked to a per-course detail page elsewhere in the
 *  app, so course names/codes are folded into the same searchable text as
 *  name/department rather than treated as separate fields. */
export function searchTeachers(teachers: TeacherListItem[], query: string): SearchResult[] {
  return teachers
    .filter((t) =>
      matches(
        [t.name, t.department ?? '', ...t.courses.map((c) => `${c.code ?? ''} ${c.name}`)].join(' '),
        query,
      ),
    )
    .map((t) => ({
      category: 'teacher',
      id: t.id,
      title: t.name,
      subtitle: t.department ?? 'Teacher',
      href: `/teachers/${t.id}`,
    }));
}

/** Papers have no standalone detail page (they open in a preview modal on
 *  the Papers/folder page itself) — the closest stable link is the
 *  paper's own folder, or the main Papers list for uncategorized ones. */
export function searchPapers(papers: Paper[], query: string): SearchResult[] {
  return papers
    .filter((p) => matches(`${p.title} ${p.subject} ${p.department ?? ''}`, query))
    .map((p) => ({
      category: 'paper',
      id: p.id,
      title: p.title,
      subtitle: p.folderName ? `${p.subject} · ${p.folderName}` : p.subject,
      href: p.folderId ? `/papers/folder/${p.folderId}` : '/papers',
    }));
}

/** FAQ items don't have their own URL/anchor (FaqAccordion is pure client
 *  state, no deep link) — results point at /faq itself. */
export function searchFaqs(faqs: FaqItem[], query: string): SearchResult[] {
  return faqs
    .filter((f) => matches(`${f.question} ${f.answer}`, query))
    .map((f) => ({
      category: 'faq',
      id: f.id,
      title: f.question,
      subtitle: f.category,
      href: '/faq',
    }));
}

export function searchQuestions(questions: QuestionListItem[], query: string): SearchResult[] {
  return questions
    .filter((q) => matches(`${q.title} ${q.body ?? ''}`, query))
    .map((q) => ({
      category: 'question',
      id: q.id,
      title: q.title,
      subtitle: q.teacherName ?? q.paperTitle ?? q.department ?? 'Q&A',
      href: `/questions/${q.id}`,
    }));
}

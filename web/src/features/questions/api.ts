import { isAdminEmail } from '@/lib/admin';
import { sanitizeText } from '@/lib/sanitize';
import { supabase, toFriendlyError } from '@/lib/supabase';
import { callCommunityFunction, isCommunityFunctionConfigured } from '@/lib/communityFunction';
import { analyzeReviewQuality } from '@/features/teachers/quality';
import type { AnswerItem, QuestionDetail, QuestionListItem } from './data';

const QUESTION_COLUMNS =
  'id, title, body, is_anonymous, upvote_count, answer_count, accepted_answer_id, created_at, teacher_id, paper_id, departments(name), users(name, email), teachers(name), uploads(title)';
const ANSWER_COLUMNS = 'id, body, is_anonymous, upvote_count, created_at, users(name, email)';

interface RawQuestionRow {
  id: string;
  title: string;
  body: string | null;
  is_anonymous: boolean;
  upvote_count: number | null;
  answer_count: number | null;
  accepted_answer_id: string | null;
  created_at: string;
  teacher_id: string | null;
  paper_id: string | null;
  departments: { name: string } | null;
  users: { name: string | null; email: string | null } | null;
  teachers: { name: string } | null;
  uploads: { title: string } | null;
}

interface RawAnswerRow {
  id: string;
  body: string;
  is_anonymous: boolean;
  upvote_count: number | null;
  created_at: string;
  users: { name: string | null; email: string | null } | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function questionAuthor(row: Pick<RawQuestionRow, 'is_anonymous' | 'users'>): string {
  if (row.is_anonymous) return 'Anonymous Student';
  if (isAdminEmail(row.users?.email)) return 'Admin';
  return row.users?.name || 'Student';
}

function answerAuthor(row: Pick<RawAnswerRow, 'is_anonymous' | 'users'>): string {
  if (row.is_anonymous) return 'Anonymous Student';
  if (isAdminEmail(row.users?.email)) return 'Admin';
  return row.users?.name || 'Student';
}

function mapQuestion(row: RawQuestionRow): QuestionListItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    department: row.departments?.name ?? null,
    author: questionAuthor(row),
    upvoteCount: row.upvote_count ?? 0,
    votedByMe: false,
    reportedByMe: false,
    answerCount: row.answer_count ?? 0,
    acceptedAnswerId: row.accepted_answer_id,
    createdAt: formatDate(row.created_at),
    teacherId: row.teacher_id,
    teacherName: row.teachers?.name ?? null,
    paperId: row.paper_id,
    paperTitle: row.uploads?.title ?? null,
  };
}

export interface QuestionFilters {
  teacherId?: string;
  paperId?: string;
}

export async function fetchQuestions(
  userId?: string,
  filters: QuestionFilters = {},
): Promise<QuestionListItem[]> {
  try {
    let query = supabase
      .from('questions')
      .select(QUESTION_COLUMNS)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
    if (filters.paperId) query = query.eq('paper_id', filters.paperId);

    const { data, error } = await query;
    if (error) throw error;
    const questions = ((data ?? []) as unknown as RawQuestionRow[]).map(mapQuestion);
    if (!userId || questions.length === 0) return questions;

    const ids = questions.map((question) => question.id);
    const [votes, reports] = await Promise.all([
      supabase.from('question_votes').select('question_id').eq('user_id', userId).in('question_id', ids),
      supabase.from('question_reports').select('question_id').eq('user_id', userId).in('question_id', ids),
    ]);
    if (votes.error) throw votes.error;
    if (reports.error) throw reports.error;
    const voted = new Set((votes.data ?? []).map((row) => (row as { question_id: string }).question_id));
    const reported = new Set((reports.data ?? []).map((row) => (row as { question_id: string }).question_id));

    return questions.map((question) => ({
      ...question,
      votedByMe: voted.has(question.id),
      reportedByMe: reported.has(question.id),
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function fetchQuestionById(id: string, userId?: string): Promise<QuestionDetail> {
  try {
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select(QUESTION_COLUMNS)
      .eq('id', id)
      .eq('status', 'active')
      .single();
    if (questionError) throw questionError;

    const { data: answerData, error: answerError } = await supabase
      .from('answers')
      .select(ANSWER_COLUMNS)
      .eq('question_id', id)
      .eq('status', 'active')
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: true });
    if (answerError) throw answerError;

    let question = mapQuestion(questionData as unknown as RawQuestionRow);
    const answers: AnswerItem[] = ((answerData ?? []) as unknown as RawAnswerRow[]).map((answer) => ({
      id: answer.id,
      body: answer.body,
      author: answerAuthor(answer),
      upvoteCount: answer.upvote_count ?? 0,
      votedByMe: false,
      reportedByMe: false,
      accepted: answer.id === question.acceptedAnswerId,
      createdAt: formatDate(answer.created_at),
    }));

    if (!userId) return { ...question, answers };

    const answerIds = answers.map((answer) => answer.id);
    const [questionVotes, questionReports, answerVotes, answerReports] = await Promise.all([
      supabase.from('question_votes').select('question_id').eq('user_id', userId).eq('question_id', id),
      supabase.from('question_reports').select('question_id').eq('user_id', userId).eq('question_id', id),
      answerIds.length
        ? supabase.from('answer_votes').select('answer_id').eq('user_id', userId).in('answer_id', answerIds)
        : Promise.resolve({ data: [], error: null }),
      answerIds.length
        ? supabase.from('answer_reports').select('answer_id').eq('user_id', userId).in('answer_id', answerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    for (const result of [questionVotes, questionReports, answerVotes, answerReports]) {
      if (result.error) throw result.error;
    }

    question = {
      ...question,
      votedByMe: Boolean(questionVotes.data?.length),
      reportedByMe: Boolean(questionReports.data?.length),
    };
    const votedAnswers = new Set(
      ((answerVotes.data ?? []) as { answer_id: string }[]).map((row) => row.answer_id),
    );
    const reportedAnswers = new Set(
      ((answerReports.data ?? []) as { answer_id: string }[]).map((row) => row.answer_id),
    );

    return {
      ...question,
      answers: answers.map((answer) => ({
        ...answer,
        votedByMe: votedAnswers.has(answer.id),
        reportedByMe: reportedAnswers.has(answer.id),
      })),
    };
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function submitQuestion(input: {
  userId: string;
  title: string;
  body: string;
  departmentId: string | null;
  isAnonymous: boolean;
  teacherId?: string | null;
  paperId?: string | null;
}): Promise<void> {
  if (isCommunityFunctionConfigured()) {
    return callCommunityFunction<void>('submitQuestion', {
      title: input.title,
      body: input.body,
      departmentId: input.departmentId,
      isAnonymous: input.isAnonymous,
      teacherId: input.teacherId ?? null,
      paperId: input.paperId ?? null,
    });
  }

  try {
    const title = sanitizeText(input.title);
    const body = sanitizeText(input.body);
    const quality = analyzeReviewQuality(`${title} ${body}`);
    const { error } = await supabase.from('questions').insert({
      user_id: input.userId,
      title,
      body: body || null,
      department_id: input.departmentId,
      is_anonymous: input.isAnonymous,
      quality_flags: quality.flags,
      moderation_priority: quality.priority,
      teacher_id: input.teacherId ?? null,
      paper_id: input.paperId ?? null,
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function submitAnswer(input: {
  questionId: string;
  userId: string;
  body: string;
  isAnonymous: boolean;
}): Promise<void> {
  if (isCommunityFunctionConfigured()) {
    return callCommunityFunction<void>('submitAnswer', {
      questionId: input.questionId,
      body: input.body,
      isAnonymous: input.isAnonymous,
    });
  }

  try {
    const body = sanitizeText(input.body);
    const quality = analyzeReviewQuality(body);
    const { error: insertError } = await supabase.from('answers').insert({
      question_id: input.questionId,
      user_id: input.userId,
      body,
      is_anonymous: input.isAnonymous,
      quality_flags: quality.flags,
      moderation_priority: quality.priority,
    });
    if (insertError) throw insertError;

    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('answer_count')
      .eq('id', input.questionId)
      .single();
    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('questions')
      .update({ answer_count: Number((question as { answer_count?: number }).answer_count ?? 0) + 1 })
      .eq('id', input.questionId);
    if (updateError) throw updateError;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function toggleQuestionVote(questionId: string): Promise<{ voted: boolean; count: number }> {
  try {
    return await callCommunityFunction('toggleQuestionVote', { questionId });
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function toggleAnswerVote(answerId: string): Promise<{ voted: boolean; count: number }> {
  try {
    return await callCommunityFunction('toggleAnswerVote', { answerId });
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function reportQuestion(questionId: string): Promise<{ reported: boolean; count: number }> {
  try {
    return await callCommunityFunction('reportQuestion', { questionId });
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function reportAnswer(answerId: string): Promise<{ reported: boolean; count: number }> {
  try {
    return await callCommunityFunction('reportAnswer', { answerId });
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

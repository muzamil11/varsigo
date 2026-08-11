export interface QuestionListItem {
  id: string;
  title: string;
  body: string | null;
  department: string | null;
  author: string;
  upvoteCount: number;
  votedByMe: boolean;
  reportedByMe: boolean;
  answerCount: number;
  acceptedAnswerId: string | null;
  createdAt: string;
  teacherId: string | null;
  teacherName: string | null;
  paperId: string | null;
  paperTitle: string | null;
}

export interface AnswerItem {
  id: string;
  body: string;
  author: string;
  upvoteCount: number;
  votedByMe: boolean;
  reportedByMe: boolean;
  accepted: boolean;
  createdAt: string;
}

export interface QuestionDetail extends QuestionListItem {
  answers: AnswerItem[];
}

import { firebaseAuth } from './firebase';

const reportReviewFunctionUrl = process.env.NEXT_PUBLIC_REPORT_REVIEW_FUNCTION_URL;

export function isReportReviewFunctionConfigured(): boolean {
  return Boolean(
    reportReviewFunctionUrl && reportReviewFunctionUrl !== 'your_report_review_function_url',
  );
}

export async function callReviewFunction<T>(
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  if (!isReportReviewFunctionConfigured() || !reportReviewFunctionUrl) {
    throw new Error('Report review function is not configured.');
  }

  const token = await firebaseAuth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Your session expired. Please log in again.');
  }

  const response = await fetch(reportReviewFunctionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });
  const result = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error ?? 'Review request failed.');
  }
  return result?.data as T;
}

export async function callReportReviewFunction(reviewId: string): Promise<void> {
  return callReviewFunction<void>('reportReview', { reviewId });
}

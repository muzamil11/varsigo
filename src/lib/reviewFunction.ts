import { firebaseAuth } from './firebase';

const reportReviewFunctionUrl = process.env.EXPO_PUBLIC_REPORT_REVIEW_FUNCTION_URL;

export function isReportReviewFunctionConfigured(): boolean {
  return Boolean(
    reportReviewFunctionUrl &&
      reportReviewFunctionUrl !== 'your_report_review_function_url',
  );
}

export async function callReportReviewFunction(reviewId: string): Promise<void> {
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
    body: JSON.stringify({ reviewId }),
  });
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error ?? 'Could not report review.');
  }
}

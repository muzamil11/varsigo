export interface ReviewQualityResult {
  flags: string[];
  priority: number;
  fingerprint: string;
}

const ABUSE_KEYWORDS = ['bekar', 'fazool', 'hate', 'idiot', 'stupid', 'useless', 'worst'];

function normalizeComment(comment: string): string {
  return comment
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function fingerprintReview(comment: string): string {
  return normalizeComment(comment).slice(0, 240);
}

export function analyzeReviewQuality(comment: string): ReviewQualityResult {
  const normalized = normalizeComment(comment);
  const flags = new Set<string>();

  if (normalized.length < 20) flags.add('thin_comment');
  if (/(.)\1{5,}/i.test(comment)) flags.add('repeated_characters');
  if (comment.length >= 20) {
    const letters = comment.replace(/[^a-z]/gi, '');
    const uppercase = letters.replace(/[^A-Z]/g, '');
    if (letters.length >= 12 && uppercase.length / letters.length > 0.7) {
      flags.add('mostly_caps');
    }
  }
  if (ABUSE_KEYWORDS.some((word) => normalized.includes(word))) {
    flags.add('possible_abuse');
  }

  let priority = 0;
  if (flags.has('possible_abuse')) priority += 60;
  if (flags.has('mostly_caps')) priority += 20;
  if (flags.has('repeated_characters')) priority += 20;
  if (flags.has('thin_comment')) priority += 10;

  return {
    flags: [...flags],
    priority,
    fingerprint: fingerprintReview(comment),
  };
}

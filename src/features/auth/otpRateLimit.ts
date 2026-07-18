import AsyncStorage from '@react-native-async-storage/async-storage';

const RESEND_COOLDOWN_MS = 60_000;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 10 * 60_000;
const SUSPICIOUS_SESSION_THRESHOLD = 5;
const SUSPICIOUS_LOCK_MS = 30 * 60_000;

// In-memory only — intentionally resets on app restart/reload, per spec
// ("more than 5 times in the same app session"). This is a tighter tier
// layered on top of the persisted 3-per-10-minutes window below, not a
// replacement for it: that one has to survive restarts to mean anything,
// this one is deliberately session-scoped.
const sessionSendCounts = new Map<string, number>();

interface LockState {
  until: number;
  reason: 'rate' | 'suspicious';
}

function lockKey(phone: string) {
  return `campuslens-otp-lock-${phone}`;
}
function logKey(phone: string) {
  return `campuslens-otp-log-${phone}`;
}
function lastSentKey(phone: string) {
  return `campuslens-otp-lastsent-${phone}`;
}

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export interface SendGate {
  allowed: boolean;
  message?: string;
  retryAfterMs?: number;
}

/** Checks every rate-limit tier before sending an OTP: an already-active
 *  lock (from either tier below) first, then the 3-per-10-minutes sliding
 *  window (which, if newly tripped, itself creates a 'rate' lock). */
export async function checkOtpSendAllowed(phone: string): Promise<SendGate> {
  const now = Date.now();

  const lock = await readJSON<LockState>(lockKey(phone));
  if (lock && lock.until > now) {
    return {
      allowed: false,
      message:
        lock.reason === 'suspicious'
          ? 'Suspicious activity detected. This number is temporarily locked.'
          : 'Too many attempts. Please wait 10 minutes.',
      retryAfterMs: lock.until - now,
    };
  }

  const log = (await readJSON<number[]>(logKey(phone))) ?? [];
  const recent = log.filter((t) => now - t < SEND_WINDOW_MS);
  if (recent.length >= MAX_SENDS_PER_WINDOW) {
    const retryAfterMs = SEND_WINDOW_MS - (now - recent[0]);
    const newLock: LockState = { until: now + retryAfterMs, reason: 'rate' };
    await AsyncStorage.setItem(lockKey(phone), JSON.stringify(newLock));
    return { allowed: false, message: 'Too many attempts. Please wait 10 minutes.', retryAfterMs };
  }

  return { allowed: true };
}

/** Records a successful OTP send: updates the resend-cooldown timestamp and
 *  the 10-minute sliding-window log, and bumps the in-session
 *  suspicious-activity counter — past SUSPICIOUS_SESSION_THRESHOLD sends in
 *  one session, this escalates to a persisted 30-minute lock. */
export async function recordOtpSent(phone: string): Promise<void> {
  const now = Date.now();
  await AsyncStorage.setItem(lastSentKey(phone), JSON.stringify(now));

  const log = (await readJSON<number[]>(logKey(phone))) ?? [];
  const recent = log.filter((t) => now - t < SEND_WINDOW_MS);
  recent.push(now);
  await AsyncStorage.setItem(logKey(phone), JSON.stringify(recent));

  const sessionCount = (sessionSendCounts.get(phone) ?? 0) + 1;
  sessionSendCounts.set(phone, sessionCount);
  if (sessionCount > SUSPICIOUS_SESSION_THRESHOLD) {
    const newLock: LockState = { until: now + SUSPICIOUS_LOCK_MS, reason: 'suspicious' };
    await AsyncStorage.setItem(lockKey(phone), JSON.stringify(newLock));
  }
}

/** Seconds remaining before "Resend OTP" should re-enable — reads the
 *  persisted last-sent time so a killed-and-reopened app resumes the same
 *  countdown instead of resetting it. */
export async function getResendCountdownSeconds(phone: string): Promise<number> {
  const lastSent = await readJSON<number>(lastSentKey(phone));
  if (!lastSent) return 0;
  const remaining = RESEND_COOLDOWN_MS - (Date.now() - lastSent);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

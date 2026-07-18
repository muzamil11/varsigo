import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import type { ConfirmationResult } from '@firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, Screen } from '@/components';
import { upsertUserByPhone } from '@/features/auth/api';
import { isValidPakistaniPhone, sendOtp, toE164, verifyOtp } from '@/features/auth/otp';
import {
  checkOtpSendAllowed,
  getResendCountdownSeconds,
  recordOtpSent,
} from '@/features/auth/otpRateLimit';
import { firebaseConfig } from '@/lib/firebase';
import { getPostAuthRoute } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';
import { useThemeColors } from '@/store/themeStore';

const MAX_VERIFY_ATTEMPTS = 5;

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const codeInputRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [verifyAttemptsRemaining, setVerifyAttemptsRemaining] = useState<number | null>(null);

  const [resendCountdown, setResendCountdown] = useState(0);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [lockRemainingMs, setLockRemainingMs] = useState(0);

  // As soon as a full, validly-formatted number is typed, resume its resend
  // countdown (survives app kill/reopen — see getResendCountdownSeconds) and
  // pick up any active send lock for it.
  useEffect(() => {
    if (!isValidPakistaniPhone(phone)) return;
    let cancelled = false;
    (async () => {
      const [seconds, gate] = await Promise.all([
        getResendCountdownSeconds(phone),
        checkOtpSendAllowed(phone),
      ]);
      if (cancelled) return;
      setResendCountdown(seconds);
      setLockMessage(gate.allowed ? null : (gate.message ?? null));
      setLockRemainingMs(gate.allowed ? 0 : (gate.retryAfterMs ?? 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [phone]);

  // Tick the resend countdown once a second, without recreating the
  // interval on every single decrement.
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => {
      setResendCountdown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resendCountdown > 0]);

  // Same pattern for the send-lock countdown.
  useEffect(() => {
    if (lockRemainingMs <= 0) return;
    const t = setInterval(() => {
      setLockRemainingMs((ms) => {
        if (ms <= 1000) {
          setLockMessage(null);
          return 0;
        }
        return ms - 1000;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockRemainingMs > 0]);

  // Auto-focus the code field the moment the OTP step appears.
  useEffect(() => {
    if (!otpSent) return;
    const t = setTimeout(() => codeInputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [otpSent]);

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!isValidPakistaniPhone(trimmed)) {
      setPhoneError('Please enter a valid Pakistani number (+92XXXXXXXXXX).');
      return;
    }
    setPhoneError(null);

    const gate = await checkOtpSendAllowed(trimmed);
    if (!gate.allowed) {
      setLockMessage(gate.message ?? null);
      setLockRemainingMs(gate.retryAfterMs ?? 0);
      return;
    }
    if (!recaptchaVerifier.current) return;

    setLoading(true);
    try {
      const result = await sendOtp(trimmed, recaptchaVerifier.current);
      await recordOtpSent(trimmed);
      setConfirmation(result);
      setOtpSent(true);
      setCode('');
      setVerifyAttemptsRemaining(null);
      setResendCountdown(await getResendCountdownSeconds(trimmed));
    } catch (error) {
      Alert.alert('Could not send code', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!confirmation || loading || code.length !== 6) return;
    setLoading(true);
    try {
      const firebaseUser = await verifyOtp(confirmation, code);
      const supabaseUser = await upsertUserByPhone(toE164(phone));
      useAuthStore.getState().setUser(firebaseUser.uid, supabaseUser);
      router.replace(getPostAuthRoute(supabaseUser, usePrivacyStore.getState().accepted));
    } catch (error) {
      setCode('');
      const remaining =
        verifyAttemptsRemaining === null ? MAX_VERIFY_ATTEMPTS - 1 : verifyAttemptsRemaining - 1;
      if (remaining <= 0) {
        Alert.alert('Too many incorrect attempts', 'Please request a new code.', [
          {
            text: 'OK',
            onPress: () => {
              setOtpSent(false);
              setConfirmation(null);
              setVerifyAttemptsRemaining(null);
            },
          },
        ]);
      } else {
        setVerifyAttemptsRemaining(remaining);
        Alert.alert('Verification failed', error instanceof Error ? error.message : 'Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit the moment a full 6-digit code is entered.
  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <Screen>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-4"
      >
        <View className="mb-10">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Ionicons name="school" size={28} color="#FFFFFF" />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            {otpSent ? 'Enter the code' : 'Welcome to Varsigo'}
          </Text>
          <Text className="mt-2 text-base text-muted dark:text-muted-dark">
            {otpSent
              ? `We sent a 6-digit code to ${phone}`
              : 'Sign in with your phone number to continue'}
          </Text>
        </View>

        {!otpSent ? (
          <>
            <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError(null);
              }}
              placeholder="+92XXXXXXXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              className="mb-2 h-14 rounded-xl border border-line bg-card px-4 text-lg text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
            />
            {phoneError && (
              <Text className="mb-4 text-xs text-red-600 dark:text-red-400">{phoneError}</Text>
            )}
            {lockMessage && (
              <Text className="mb-4 text-xs text-red-600 dark:text-red-400">
                {lockMessage}
                {lockRemainingMs > 0 ? ` (${formatDuration(lockRemainingMs)})` : ''}
              </Text>
            )}
            <Button
              label="Send OTP"
              onPress={handleSendOtp}
              loading={loading}
              disabled={lockRemainingMs > 0}
              className={phoneError || lockMessage ? '' : 'mt-4'}
            />
          </>
        ) : (
          <>
            <Text className="mb-2 text-sm font-medium text-muted dark:text-muted-dark">
              6-digit code
            </Text>
            <TextInput
              ref={codeInputRef}
              value={code}
              onChangeText={setCode}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              className="mb-2 h-14 rounded-xl border border-line bg-card px-4 text-center text-2xl tracking-[12px] text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
            />
            {verifyAttemptsRemaining !== null && (
              <Text className="mb-4 text-xs text-red-600 dark:text-red-400">
                {verifyAttemptsRemaining} attempt{verifyAttemptsRemaining === 1 ? '' : 's'}{' '}
                remaining
              </Text>
            )}
            <Button
              label="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              disabled={code.length !== 6}
              className={verifyAttemptsRemaining !== null ? '' : 'mt-4'}
            />
            <Button
              label={resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
              variant="ghost"
              onPress={handleSendOtp}
              disabled={resendCountdown > 0 || loading || lockRemainingMs > 0}
              className="mt-3"
            />
            <Button
              label="Change number"
              variant="ghost"
              onPress={() => {
                setOtpSent(false);
                setCode('');
                setConfirmation(null);
                setVerifyAttemptsRemaining(null);
              }}
              className="mt-3"
            />
            {lockMessage && (
              <Text className="mt-3 text-center text-xs text-red-600 dark:text-red-400">
                {lockMessage}
                {lockRemainingMs > 0 ? ` (${formatDuration(lockRemainingMs)})` : ''}
              </Text>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

// @firebase/auth's package.json "exports" map puts an unconditional top-level
// "types" key ahead of its "react-native" condition branch, so TypeScript
// always resolves this module's types to the platform-generic
// auth-public.d.ts and never sees the React-Native-only APIs — even though
// Metro's runtime resolution picks the correct RN build via that same
// condition (see src/lib/firebase.ts's comment). This augmentation only
// fixes the missing TYPE surface; it changes nothing at runtime.
//
// The `export {}` below is required for this to MERGE with (rather than
// wholesale replace) the real auth-public.d.ts's declarations — without it,
// TS treats this file as a global script and the `declare module` block
// becomes the sole definition of '@firebase/auth', silently dropping every
// export this file doesn't also redeclare (signOut, User, etc.).
export {};

declare module '@firebase/auth' {
  export function getReactNativePersistence(
    storage: unknown,
  ): import('@firebase/auth').Persistence;
}

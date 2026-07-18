@AGENTS.md

# Varsigo

Mobile app for Pakistani university students (starting with NED University, Karachi).
MVP features: **Teacher Reviews**, **Past Papers & Notes**, **University FAQ**.

## Stack

- **Expo SDK 54** + React Native 0.81 (New Architecture), React 19, TypeScript (strict)
- **Expo Router v6** — file-based routing under `src/app/`
- **NativeWind v4** — Tailwind classes via `className`; config in `tailwind.config.js`
- **Zustand** — global state (`src/store/`), persisted with AsyncStorage
- **Supabase** — Postgres (teachers/reviews/departments/uploads) + Storage (`papers` bucket for PDFs)
- **Firebase** — Google Sign-In auth via `@react-native-google-signin/google-signin` + the Firebase JS SDK's `signInWithCredential`. This is a native module, so the app now requires a custom dev client — see "Auth" below.

Run with `npx expo start --dev-client` (after installing a dev build via `eas build --profile development` — plain Expo Go no longer works, see "Auth" below).
Typecheck with `npx tsc --noEmit`. Bundle-check with `npx expo export --platform android`.

## Folder structure

```
src/
├── app/                  # Expo Router screens (file = route)
│   ├── _layout.tsx       # Root stack + StatusBar + theme sync
│   ├── index.tsx         # Splash → routes to /(tabs) or /login based on authStore
│   ├── login.tsx         # Google Sign-In via Firebase, upserts Supabase user, sets authStore
│   ├── (tabs)/           # Bottom tab bar: Home, Teachers, Papers, FAQ
│   ├── teachers/[id]/    # Teacher detail + add-review (stack, outside tabs)
│   └── papers/upload.tsx # Upload PDF flow (stack, outside tabs)
├── components/           # Shared UI: Screen, Card, Button, Chip, SearchBar, ThemeToggle,
│                         # StateMessage (error/empty), Skeleton (loading placeholders)
├── features/             # Feature modules — domain types + api.ts (Supabase calls) + components
│   ├── auth/             # google.ts (Firebase Google Sign-In), api.ts (upsert Supabase user)
│   ├── departments/      # types.ts, api.ts (fetchDepartments)
│   ├── teachers/         # data.ts (types), api.ts (fetch/submit), TeacherCard, RatingBar
│   ├── papers/           # data.ts (types), api.ts (fetch/upload), PaperCard
│   └── faq/              # data.ts (static content — no backend), FaqAccordionItem
├── store/                # Zustand stores: themeStore, authStore (persisted login)
├── lib/                  # supabase.ts, firebase.ts (real clients), database.types.ts, seed.ts
├── theme/                # colors.ts (palette), typography.ts
└── global.css            # Tailwind directives (loaded once in app/_layout.tsx)
supabase/
└── schema.sql            # Run in Supabase SQL Editor — tables, RLS, storage bucket
```

Import alias: `@/` → `src/` (see `tsconfig.json` paths).

## Backend

- **Schema**: `supabase/schema.sql` is the source of truth — run it once in the Supabase SQL Editor. It creates `users`, `departments`, `teachers`, `reviews`, `uploads`, indexes, RLS policies, and the `papers` storage bucket.
- **RLS is intentionally permissive**: this app authenticates via Firebase, not Supabase Auth, so there's no `auth.uid()` to key policies on. Anon can read approved rows and insert reviews/uploads/users, but NOT insert departments/teachers directly (see `src/lib/seed.ts`, which uses the service-role key instead). Before real users hit this, move writes behind a server that verifies the Firebase ID token.
- **`users`** is keyed by `firebase_uid` (the Firebase UID from Google Sign-In), not `phone` — see "Auth" below. `email` is stored alongside it for admin identification and display.
- **`src/lib/supabase.ts`** exports a plain (non-schema-generic) client — see the comment at the top of `src/lib/database.types.ts` for why `createClient<Database>()` isn't used (a hand-written `Database` type collapses table rows to `never` without the `__InternalSupabase` marker that `supabase gen types` produces). Each `api.ts` module casts query results to the hand-written `Row` types instead.
- **Seeding**: `npm run seed` populates 6 NED departments × 3 teachers. Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (server-only, no `EXPO_PUBLIC_` prefix — never bundled into the app).

## Auth

Google Sign-In via `@react-native-google-signin/google-signin` (native module) + Firebase's `signInWithCredential` (`src/features/auth/google.ts`). `GoogleSignin.signIn()` returns an ID token, which is exchanged for a Firebase credential — the resulting Firebase UID + email become the Supabase `users` row (`firebase_uid` unique key, `email` for display/admin identification).

**Known tradeoff — Expo Go no longer works.** `@react-native-google-signin/google-signin` requires custom native code, so this app now needs a **custom dev client** instead of Expo Go (this replaced the earlier phone-OTP + `expo-firebase-recaptcha` setup, which was chosen specifically to stay Expo-Go-compatible — that constraint no longer holds). Day-to-day dev flow: `eas build --profile development` once to get an installable dev client, then `npx expo start --dev-client` instead of scanning into Expo Go.

**Required manual setup** (not automatable from code — needs your own Firebase/Google Cloud console access):
1. Firebase Console → Authentication → Sign-in method → enable **Google**.
2. Firebase Console → Project settings → add an **Android** app (package `com.varsigo.app`) and an **iOS** app (bundle id `com.varsigo.app`) if not already registered — download `google-services.json` / `GoogleService-Info.plist` into the project root (paths referenced in `app.json`).
3. Add the Android app's SHA-1/SHA-256 fingerprint in Firebase (get it via `eas credentials`) — required for Google Sign-In to work on Android.
4. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (the "Web client (auto created by Google Service)" OAuth client ID — also findable inside `google-services.json` under `client[].oauth_client[]` where `client_type` is `3`) and `EXPO_PUBLIC_ADMIN_EMAIL` in `.env.local` and in every `eas.json` build profile.

`src/store/authStore.ts` (Zustand + AsyncStorage) is the actual "is logged in" source of truth across restarts — not Firebase's own session, which isn't persisted (see comment in `src/lib/firebase.ts`). The splash screen (`app/index.tsx`) waits for `hasHydrated` before deciding whether to route to `/login` or `/(tabs)`.

## Theme system

Default theme is **dark**; users toggle via the `ThemeToggle` button (Home header).

- `src/store/themeStore.ts` holds the persisted `theme` ('dark' | 'light'). Toggling calls NativeWind's `colorScheme.set()`, which drives all `dark:` classes. `darkMode: 'class'` in `tailwind.config.js` means the OS setting is ignored — the store is the single source of truth.
- **Styling components:** use Tailwind classes with the semantic color names from `tailwind.config.js`, always pairing base + dark variant:
  - background: `bg-background dark:bg-background-dark` (#FFFFFF / #0A0A0A)
  - surfaces: `bg-card dark:bg-card-dark` (#F4F4F5 / #111111)
  - text: `text-foreground dark:text-foreground-dark` (#09090B / #FAFAFA)
  - secondary text: `text-muted dark:text-muted-dark`
  - borders: `border-line dark:border-line-dark`
  - accent (same in both themes): `bg-accent`, `text-accent` (#6366F1)
- **Raw color values** (for props that need strings, not classes — tab bar tints, icon `color`, slider tracks): call `useThemeColors()` from `src/store/themeStore.ts`. Never hardcode hex values in components; the only exception is `#6366F1`/`#FFFFFF` for accent-on-accent icons.

## Component patterns

- Every screen returns `<Screen>` (themed SafeAreaView) as its root.
- Screens own navigation/headers: root stack has `headerShown: false`; detail screens render their own back-chevron header row (see `teachers/[id]/index.tsx`).
- Shared primitives live in `src/components` and are exported from its `index.ts` — import as `import { Card, Chip } from '@/components'`.
- Feature-specific components (TeacherCard, PaperCard, …) live in their feature folder and import shared primitives.
- **Data-loading screens** (Home, Teachers, Papers, Teacher detail) follow the same three-state pattern: `loading` → `<CardSkeletonList />`, `error` → `<StateMessage icon=... onRetry={load} />`, else the real `FlatList`/content. Copy this pattern for any new data-driven screen rather than inventing a new one.
- All Supabase calls live in a feature's `api.ts`, each wrapped in try/catch and re-thrown via `toFriendlyError()` (from `@/lib/supabase`) so screens only ever need `error instanceof Error ? error.message : '...'`.
- Lists use `FlatList` with text-search filtering done client-side in `useMemo`; server-side filters (department, year, kind) are passed to the `api.ts` fetch function and trigger a re-fetch.
- Navigation: `useRouter()` + typed paths (`router.push(\`/teachers/${id}\`)`); route params via `useLocalSearchParams`.

## Conventions

- TypeScript strict; type all component props with an interface/inline object type.
- Domain types live in `features/<feature>/data.ts` (or `types.ts` for departments); `api.ts` in the same folder does the Supabase fetching/mutation and maps rows to those domain types.
- Keep screens thin — heavy UI pieces go into feature components.
- Windows dev environment: use cross-platform npm scripts, no Unix-only commands in package.json.

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
- **Firebase** — phone OTP auth via the JS SDK + a WebView reCAPTCHA (`expo-firebase-recaptcha`), chosen specifically to keep the app Expo-Go-compatible — see "Auth" below for the tradeoff this implies.

Run with `npx expo start` and scan the QR code in Expo Go.
Typecheck with `npx tsc --noEmit`. Bundle-check with `npx expo export --platform android`.
`npx expo-doctor` will always show 1 known failure (`expo-firebase-recaptcha` deprecated) — that's accepted, see "Auth" below.

## Folder structure

```
src/
├── app/                  # Expo Router screens (file = route)
│   ├── _layout.tsx       # Root stack + StatusBar + theme sync
│   ├── index.tsx         # Splash → routes to /(tabs) or /login based on authStore
│   ├── login.tsx         # Phone + OTP via Firebase, upserts Supabase user, sets authStore
│   ├── (tabs)/           # Bottom tab bar: Home, Teachers, Papers, FAQ
│   ├── teachers/[id]/    # Teacher detail + add-review (stack, outside tabs)
│   └── papers/upload.tsx # Upload PDF flow (stack, outside tabs)
├── components/           # Shared UI: Screen, Card, Button, Chip, SearchBar, ThemeToggle,
│                         # StateMessage (error/empty), Skeleton (loading placeholders)
├── features/             # Feature modules — domain types + api.ts (Supabase calls) + components
│   ├── auth/             # otp.ts (Firebase phone auth), api.ts (upsert Supabase user)
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
- **`src/lib/supabase.ts`** exports a plain (non-schema-generic) client — see the comment at the top of `src/lib/database.types.ts` for why `createClient<Database>()` isn't used (a hand-written `Database` type collapses table rows to `never` without the `__InternalSupabase` marker that `supabase gen types` produces). Each `api.ts` module casts query results to the hand-written `Row` types instead.
- **Seeding**: `npm run seed` populates 6 NED departments × 3 teachers. Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (server-only, no `EXPO_PUBLIC_` prefix — never bundled into the app).

## Auth

Firebase phone OTP, using the Firebase JS SDK (not `@react-native-firebase`) so the app keeps working in Expo Go. Native platforms need a reCAPTCHA challenge for phone auth, provided here by `expo-firebase-recaptcha`'s `FirebaseRecaptchaVerifierModal` (a WebView-based challenge) in `login.tsx`.

**Known tradeoff**: `expo-firebase-recaptcha` was removed from Expo's supported package list as of SDK 48 and is unmaintained. It still works (verified: bundles cleanly, its native module import degrades to a console warning rather than crashing in Expo Go). `expo-doctor` will always flag it — that's expected, not a regression. If/when this app moves off Expo Go to a custom dev client, migrate to `@react-native-firebase/auth` for native phone auth (SMS autofill, no reCAPTCHA UI) instead.

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

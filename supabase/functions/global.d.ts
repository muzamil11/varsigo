// Ambient types for editor support only — these functions run on Deno (Supabase Edge Functions),
// not Node, so the app's tsconfig excludes this folder. This file just quiets false-positive
// squiggles in VSCode's TS server; it has no effect on the actual Deno runtime.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module 'https://esm.sh/@supabase/supabase-js@2.110.2' {
  export * from '@supabase/supabase-js';
}

import { createClient } from '@supabase/supabase-js'

// Both values below come only from environment variables — never hardcode
// a Supabase URL or key here. The anon key is safe to ship to a browser
// (it's the public, RLS-restricted key Supabase is designed to expose),
// but it still belongs in an untracked .env file, not in source, so that
// switching projects (dev/staging/prod) never means editing committed
// code. See .env.example for the variable names to set locally, and set
// the same two variables in your host's dashboard (Vercel, Netlify, etc.)
// for deployed builds.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase is not configured — copy .env.example to .env and fill in ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from your Supabase ' +
      'project settings (Project Settings → API) to enable sign in.'
  )
}

// A stub client is used when env vars are missing so the app can still
// render (with a clear "not configured" message) instead of crashing on
// import — useful for anyone who clones the repo before setting up their
// own Supabase project.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

// Wraps Supabase Auth's session so the rest of the app can just ask
// "is anyone signed in, and who" without touching the client directly.
// `loading` covers the brief moment on first load while we check for an
// existing session (e.g. from a previous visit) — routes should wait for
// this before deciding whether to redirect to /login.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.signInWithPassword({ email, password })
  }, [])

  const signUp = useCallback(async (email, password, name) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured yet.' } }
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }, [])

  const user = session?.user || null
  // Prefer the display name set at sign-up; fall back to the local part
  // of the email so there's always something reasonable to greet with.
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || ''

  return { session, user, displayName, loading, signInWithPassword, signUp, signOut }
}

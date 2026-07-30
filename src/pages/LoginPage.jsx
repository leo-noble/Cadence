import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, AlertCircle, MailCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../lib/useAuth'
import { isSupabaseConfigured } from '../lib/supabaseClient'

// Simple multicolor "G" mark — Google's brand guidelines ask that the
// logo not be recolored or altered, so this is the full four-color glyph
// rather than a currentColor icon like the rest of the UI.
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.98a9 9 0 0 0 0 8.08l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.96l2.99 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

const EMAIL_MAX = 200
const NAME_MAX = 80

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, signInWithPassword, signUp, signInWithGoogle, resetPasswordForEmail } = useAuth()

  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Where to send the user once they're signed in. A same-page redirect
  // back from Google (see signInWithGoogle) carries this as ?redirect=,
  // while an internal <Navigate state={{from}}> (from RequireAuth) carries
  // it as router state — support both.
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirect') || location.state?.from || '/app'

  // Supabase parses the OAuth hash fragment and updates the session
  // asynchronously after Google redirects back here, so wait for that
  // session to actually appear before navigating onward.
  useEffect(() => {
    if (session) navigate(redirectTo, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function handleGoogleSignIn() {
    setError('')
    setGoogleLoading(true)
    const { error: oauthError } = await signInWithGoogle(redirectTo)
    if (oauthError) {
      setError(oauthError.message || 'Could not start Google sign-in.')
      setGoogleLoading(false)
    }
    // On success the browser navigates away to Google, so no further
    // state update is needed here.
  }

  async function handleForgotSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    setSubmitting(true)
    try {
      const { error: resetError } = await resetPasswordForEmail(trimmedEmail)
      if (resetError) {
        setError(resetError.message || 'Could not send reset email.')
        return
      }
      setResetSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) return

    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error: signInError } = await signInWithPassword(trimmedEmail, password)
        if (signInError) {
          setError(signInError.message || 'Could not sign in.')
          return
        }
        navigate(redirectTo, { replace: true })
      } else {
        const { data, error: signUpError } = await signUp(trimmedEmail, password, name.trim())
        if (signUpError) {
          setError(signUpError.message || 'Could not create an account.')
          return
        }
        // With email confirmation enabled on the Supabase project, a new
        // sign-up has no active session yet — send them to check their
        // inbox rather than straight into the app.
        if (!data?.session) {
          setCheckEmail(true)
        } else {
          navigate(redirectTo, { replace: true })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <Logo size={32} />
        </div>

        <div className="rounded-card bg-surface border border-divider shadow-sheet p-7">
          {!isSupabaseConfigured ? (
            <>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5 text-center">
                Sign-in isn&rsquo;t set up yet
              </h1>
              <p className="text-[14px] text-ink-soft text-center leading-relaxed">
                This app needs a Supabase project connected before anyone can sign in. Copy{' '}
                <code className="text-[13px] bg-paper px-1.5 py-0.5 rounded">.env.example</code> to{' '}
                <code className="text-[13px] bg-paper px-1.5 py-0.5 rounded">.env</code> and fill in your project&rsquo;s URL and anon key.
              </p>
            </>
          ) : checkEmail ? (
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                  <MailCheck size={22} />
                </div>
              </div>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5">Check your inbox</h1>
              <p className="text-[14px] text-ink-soft leading-relaxed">
                We sent a confirmation link to <span className="text-ink">{email.trim()}</span>. Click it, then come back here to sign in.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCheckEmail(false)
                  setMode('signin')
                  setPassword('')
                }}
                className="mt-5 text-[14px] font-medium text-brand"
              >
                Back to sign in
              </button>
            </div>
          ) : resetSent ? (
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                  <MailCheck size={22} />
                </div>
              </div>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5">Check your inbox</h1>
              <p className="text-[14px] text-ink-soft leading-relaxed">
                We sent a password reset link to <span className="text-ink">{email.trim()}</span>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false)
                  setMode('signin')
                }}
                className="mt-5 text-[14px] font-medium text-brand"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === 'forgot' ? (
            <>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5 text-center">
                Reset your password
              </h1>
              <p className="text-[14px] text-ink-soft text-center mb-6">
                Enter your email and we&rsquo;ll send you a link to set a new one.
              </p>

              <form onSubmit={handleForgotSubmit}>
                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  autoFocus
                  type="email"
                  autoComplete="email"
                  value={email}
                  maxLength={EMAIL_MAX}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full mb-2 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                />

                {error && (
                  <div className="flex items-start gap-2 mb-4 mt-3 text-[13px] text-status-overdue">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <motion.button
                  whileTap={email.trim() ? { scale: 0.97 } : {}}
                  type="submit"
                  disabled={!email.trim() || submitting}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-capsule bg-brand text-white font-medium py-3 text-[15px] disabled:opacity-40 transition-opacity duration-180"
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                  {!submitting && <ArrowRight size={16} />}
                </motion.button>
              </form>

              <p className="text-[13.5px] text-ink-soft text-center mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError('')
                  }}
                  className="font-medium text-brand"
                >
                  Back to sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5 text-center">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-[14px] text-ink-soft text-center mb-6">
                {mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Just a few details to get started.'}
              </p>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleGoogleSignIn}
                disabled={googleLoading || submitting}
                className="w-full flex items-center justify-center gap-2.5 rounded-capsule border border-divider bg-surface text-ink font-medium py-3 text-[15px] disabled:opacity-40 transition-opacity duration-180"
              >
                <GoogleGlyph />
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </motion.button>

              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-divider" />
                <span className="text-[12px] uppercase tracking-wide text-ink-soft">or</span>
                <div className="h-px flex-1 bg-divider" />
              </div>

              <form onSubmit={handleSubmit}>
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Name</label>
                      <input
                        value={name}
                        maxLength={NAME_MAX}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Nabil"
                        className="w-full mb-4 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  autoFocus
                  type="email"
                  autoComplete="email"
                  value={email}
                  maxLength={EMAIL_MAX}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full mb-4 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                />

                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  minLength={mode === 'signup' ? 6 : undefined}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mb-2 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                {mode === 'signup' && <p className="text-[12px] text-ink-soft mb-4">At least 6 characters.</p>}
                {mode === 'signin' && (
                  <div className="text-right mb-4">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError('') }}
                      className="text-[13px] font-medium text-brand"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 mb-4 mt-3 text-[13px] text-status-overdue">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <motion.button
                  whileTap={email.trim() && password ? { scale: 0.97 } : {}}
                  type="submit"
                  disabled={!email.trim() || !password || submitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-capsule bg-brand text-white font-medium py-3 text-[15px] disabled:opacity-40 transition-opacity duration-180"
                >
                  {submitting ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                  {!submitting && <ArrowRight size={16} />}
                </motion.button>
              </form>

              <p className="text-[13.5px] text-ink-soft text-center mt-5">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin')
                    setError('')
                  }}
                  className="font-medium text-brand"
                >
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

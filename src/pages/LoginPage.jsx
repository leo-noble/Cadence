import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, AlertCircle, MailCheck } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../lib/useAuth'
import { isSupabaseConfigured } from '../lib/supabaseClient'

const EMAIL_MAX = 200
const NAME_MAX = 80

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signInWithPassword, signUp } = useAuth()

  const [mode, setMode] = useState('signin') // signin | signup
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const redirectTo = location.state?.from || '/app'

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
          ) : (
            <>
              <h1 className="font-display text-[20px] font-bold text-ink tracking-tight mb-1.5 text-center">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-[14px] text-ink-soft text-center mb-6">
                {mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Just a few details to get started.'}
              </p>

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

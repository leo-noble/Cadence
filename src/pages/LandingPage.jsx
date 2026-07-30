import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Timer,
  Library,
  BellOff,
  Download,
  Sparkles,
} from 'lucide-react'
import ReviewLedger from '../components/ReviewLedger'
import Logo from '../components/Logo'
import ForgettingCurve from '../components/ForgettingCurve'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'One fixed schedule',
    body: 'Study something once, and Cadence automatically brings it back at 1, 3, 7, 14, 30, 90, and 180 days after each review — gaps that widen as it sticks.',
  },
  {
    icon: Library,
    title: 'A calm dashboard',
    body: 'Today shows exactly what\u2019s due and nothing else. No streak-shaming, no red exclamation marks, no clutter.',
  },
  {
    icon: Timer,
    title: 'Built-in focus timer',
    body: 'A simple 25/5 Pomodoro timer, linkable to whatever chapter you\u2019re revising.',
  },
  {
    icon: BellOff,
    title: 'No gamified noise',
    body: 'No leaderboards, no quizzes, no AI summaries. Just scheduling for material you already have.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Log what you studied',
    body: 'Add a chapter the day you cover it — subject, title, done. Ten seconds, no setup.',
  },
  {
    n: '02',
    title: 'Cadence files the reviews',
    body: 'It stamps the next seven review dates automatically, each gap wider than the last.',
  },
  {
    n: '03',
    title: 'Show up when it\u2019s due',
    body: 'Open Today, clear what\u2019s there, done. Nothing unlocks early, nothing piles up.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

function Reveal({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
    }
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return (
    <div className="min-h-screen bg-paper text-ink overflow-x-clip">
      {/* Nav bar */}
      <header
        className={`sticky top-0 z-20 transition-colors duration-300 ${
          scrolled
            ? 'bg-paper/80 backdrop-blur-lg border-b border-divider'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 md:px-8 py-5">
          <Logo size={26} />
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors duration-180"
            >
              Log in
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-capsule bg-brand text-white text-sm font-medium px-4 py-2 transition-transform duration-180 hover:scale-[1.03] active:scale-[0.97]"
            >
              Open app <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* Decorative gradient glow — brand/accent colors, very low opacity, purely aesthetic */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="glow-orb w-[420px] h-[420px] bg-brand/15 -top-40 -left-32" />
          <div className="glow-orb w-[360px] h-[360px] bg-accent/15 top-10 right-[-140px]" />
          <div className="glow-orb w-[280px] h-[280px] bg-status-upcoming/15 top-64 left-1/3" />
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-8 pt-14 md:pt-24 pb-16 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
          >
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand bg-brand/10 px-3 py-1 rounded-full mb-5"
            >
              <Sparkles size={12} /> Spaced-repetition scheduling for students
            </motion.span>
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tightest mb-4"
            >
              Study in rhythm.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg md:text-xl font-medium text-ink leading-snug mb-3 max-w-md"
            >
              Log what you studied today. Cadence tells you exactly when to
              revisit it — 1 day later, then 3, then a week, then further
              and further apart.
            </motion.p>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-base text-ink-soft leading-relaxed mb-7 max-w-md"
            >
              No streaks to keep alive, no quizzes, no clutter — just a calm
              daily list of what to review, so it actually sticks.
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-wrap items-center gap-3 mb-6">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-capsule bg-brand text-white font-medium px-6 py-3 text-sm shadow-fab transition-transform duration-180 hover:scale-[1.02] active:scale-[0.98]"
              >
                Start studying <ArrowRight size={16} />
              </Link>
              {installPrompt && !installed && (
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center gap-2 rounded-capsule border border-divider font-medium px-6 py-3 text-sm transition-colors duration-180 hover:bg-surface"
                >
                  <Download size={16} /> Install app
                </button>
              )}
            </motion.div>
          </motion.div>

          <div className="flex justify-center md:justify-end">
            <ReviewLedger />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-16 border-t border-divider">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-10 tracking-[-0.01em]">
            Three steps. Then it runs itself.
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <span className="font-display text-3xl text-accent tracking-tight">{s.n}</span>
              <h3 className="font-medium text-lg mt-2 mb-1.5">{s.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed max-w-xs">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The schedule, visually */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-16 border-t border-divider">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3 tracking-[-0.01em]">
            Seven reviews, spaced from a day to six months apart.
          </h2>
          <p className="text-ink-soft max-w-xl mb-10">
            Mark a chapter as studied once, and Cadence schedules everything
            after that — each gap wider than the last, so the material
            keeps sticking with less and less effort. Each review only
            unlocks on its own date; you can't jump ahead to a later one
            early.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative overflow-x-auto pb-2">
            <div className="flex items-center gap-3 min-w-max">
              {[
                ['Day 0', 'Studied', 'bg-ink'],
                ['+1 day', 'Review 1', 'bg-status-overdue'],
                ['+3 days', 'Review 2', 'bg-status-due'],
                ['+1 week', 'Review 3', 'bg-status-due'],
                ['+2 weeks', 'Review 4', 'bg-status-upcoming'],
                ['+1 month', 'Review 5', 'bg-status-upcoming'],
                ['+3 months', 'Review 6', 'bg-status-upcoming'],
                ['+6 months', 'Review 7 · Mastered', 'bg-status-mastered'],
              ].map(([day, label, color], i, arr) => (
                <div key={day} className="flex items-center gap-3">
                  <div className="rounded-card bg-surface border border-divider shadow-elevated px-4 py-3.5 text-center min-w-[100px]">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full mb-2 ${color}`} />
                    <p className="font-display text-sm font-semibold font-tabular">{day}</p>
                    <p className="text-[11px] text-ink-soft mt-0.5">{label}</p>
                  </div>
                  {i < arr.length - 1 && <ArrowRight size={14} className="text-ink-soft/50 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-8">
          <ForgettingCurve />
          <p className="text-xs text-ink-soft mt-3 max-w-xl">
            Without review, recall drops off fast. Each review resets that
            curve a little higher — which is why the gaps between reviews
            can get longer over time without losing the material.
          </p>
        </Reveal>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 py-16 border-t border-divider">
        <Reveal>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-10 tracking-[-0.01em]">
            Everything a student needs. Nothing they don't.
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 0.06}>
              <div className="h-full rounded-card bg-surface border border-divider shadow-elevated p-6 transition-transform duration-180 hover:-translate-y-0.5">
                <div className="h-9 w-9 rounded-control bg-brand/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-brand" />
                </div>
                <h3 className="font-medium mb-1.5">{title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-28 border-t border-divider text-center">
        <Reveal>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4 tracking-tightest">
            Nothing due today. Go build something.
          </h2>
          <p className="text-ink-soft mb-8 max-w-md mx-auto">
            Add your first chapter and let Cadence handle the rest.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-capsule bg-brand text-white font-medium px-7 py-3.5 text-sm shadow-fab transition-transform duration-180 hover:scale-[1.02] active:scale-[0.98]"
          >
            Open Cadence <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>

      <footer className="max-w-6xl mx-auto px-6 md:px-8 py-8 border-t border-divider flex items-center justify-between text-xs text-ink-soft">
        <span>Cadence</span>
        <span>Study in rhythm.</span>
      </footer>
    </div>
  )
}

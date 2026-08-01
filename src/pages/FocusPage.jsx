import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Square, Settings2, X, Minus, Plus, Zap } from 'lucide-react'
import { toISODate } from '../lib/srs'
import { logPomodoroSession, getPomodoroLog, getTimerState, saveTimerState, clearTimerState } from '../lib/storage'
import PageHeader from '../components/PageHeader'
import Grabber from '../components/Grabber'

const PHASE_META = {
  work: { label: 'Deep work', ring: 'stroke-brand', chip: 'text-brand bg-brand/10' },
  short_break: { label: 'Short break', ring: 'stroke-status-upcoming', chip: 'text-status-upcoming bg-status-upcoming/10' },
  long_break: { label: 'Long break', ring: 'stroke-status-mastered', chip: 'text-status-mastered bg-status-mastered/10' },
}

const CYCLE_LENGTH = 4 // work sessions before a long break

// A short, soft two-tone chime built with the Web Audio API — no audio
// asset to ship or fail to load. Runs best-effort; if a browser blocks
// audio before any user gesture, this just quietly does nothing.
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + i * 0.14
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.5)
    })
    setTimeout(() => ctx.close(), 900)
  } catch {
    // best-effort only
  }
}

const stepBtn =
  'h-7 w-7 flex items-center justify-center rounded-full bg-paper text-ink-soft hover:text-ink disabled:opacity-30 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'

function Stepper({ label, value, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[13.5px] text-ink-soft">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className={stepBtn}
        >
          <Minus size={13} />
        </button>
        {/* Announced on change so the new duration is heard, not just seen. */}
        <span aria-live="polite" className="w-9 text-center font-tabular text-[14px] text-ink">
          {value}m
        </span>
        <button
          type="button"
          disabled={disabled || value >= 120}
          onClick={() => onChange(Math.min(120, value + 1))}
          aria-label={`Increase ${label.toLowerCase()}`}
          className={stepBtn}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}

// The whole row is the control, not just the 42px track: the label is the
// button's own accessible name (it used to be an unassociated sibling
// <span>, which left the switch nameless to screen readers and gave it a
// tap target barely wider than a fingertip), and role/aria-checked make it
// announce as a switch that's on or off.
function Toggle({ label, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-2.5 text-left rounded-control disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <span className="text-[13.5px] text-ink-soft">{label}</span>
      <span
        aria-hidden="true"
        className={`relative w-[42px] h-[25px] shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-brand' : 'bg-divider'}`}
      >
        <span
          className={`absolute top-0.5 h-[21px] w-[21px] rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-[19px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function PomodoroSettingsSheet({ prefs, updatePrefs, isIdle, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-sm bg-surface rounded-t-card md:rounded-card shadow-sheet pb-[env(safe-area-inset-bottom)]"
      >
        <Grabber />
        <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
          <h2 className="font-display text-[17px] font-semibold text-ink">Timer settings</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full text-ink-soft hover:text-ink active:opacity-60">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {!isIdle && (
            <p className="text-[12.5px] text-ink-soft mb-3 leading-relaxed">
              Durations apply once the current session finishes or is stopped.
            </p>
          )}
          <div className="rounded-card bg-paper border border-divider overflow-hidden divide-y divide-divider px-5">
            <Stepper label="Focus duration" value={prefs.pomodoroWork ?? 25} onChange={(v) => updatePrefs({ pomodoroWork: v })} />
            <Stepper label="Short break" value={prefs.pomodoroShortBreak ?? 5} onChange={(v) => updatePrefs({ pomodoroShortBreak: v })} />
            <Stepper label="Long break" value={prefs.pomodoroLongBreak ?? 15} onChange={(v) => updatePrefs({ pomodoroLongBreak: v })} />
          </div>

          <div className="rounded-card bg-paper border border-divider overflow-hidden divide-y divide-divider px-5 mt-4">
            <Toggle
              label="Auto-start next session"
              checked={!!prefs.pomodoroAutoTransition}
              onChange={(v) => updatePrefs({ pomodoroAutoTransition: v })}
            />
            <Toggle
              label="Notification sound"
              checked={prefs.pomodoroSound !== false}
              onChange={(v) => updatePrefs({ pomodoroSound: v })}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FocusPage({ cadence }) {
  const { chapters, subjectMap, prefs, updatePrefs } = cadence
  const workMin = prefs.pomodoroWork ?? 25
  const shortBreakMin = prefs.pomodoroShortBreak ?? 5
  const longBreakMin = prefs.pomodoroLongBreak ?? 15
  const autoTransition = !!prefs.pomodoroAutoTransition
  const soundEnabled = prefs.pomodoroSound !== false

  const durationMsFor = useCallback(
    (p) => (p === 'work' ? workMin : p === 'short_break' ? shortBreakMin : longBreakMin) * 60000,
    [workMin, shortBreakMin, longBreakMin]
  )

  // ---- restore persisted timer state (survives refresh / backgrounded tabs) ----
  // Running phases are anchored to a wall-clock `endAt` instant rather than
  // a tick counter, so the remaining time is always recomputed from
  // Date.now() — a throttled background tab or a page reload can never
  // make it drift or reset.
  const initial = useMemo(() => {
    const saved = getTimerState()
    if (!saved) {
      return { phase: 'work', status: 'idle', remainingMs: durationMsFor('work'), cycleCount: 0, linkedChapterId: '' }
    }
    if (saved.status === 'running' && saved.endAt) {
      const remaining = saved.endAt - Date.now()
      if (remaining <= 0) {
        // The phase finished while the tab was closed/backgrounded — land
        // on a fresh, idle instance of the *next* phase rather than trying
        // to replay time that already passed.
        const wasWork = saved.phase === 'work'
        const nextPhase = wasWork
          ? (saved.cycleCount + 1) % CYCLE_LENGTH === 0
            ? 'long_break'
            : 'short_break'
          : 'work'
        return {
          phase: nextPhase,
          status: 'idle',
          remainingMs: durationMsFor(nextPhase),
          cycleCount: wasWork ? saved.cycleCount + 1 : saved.cycleCount,
          linkedChapterId: saved.linkedChapterId || '',
          _pendingLog: wasWork ? { phase: 'work', minutes: workMin } : null,
        }
      }
      return { phase: saved.phase, status: 'running', remainingMs: remaining, cycleCount: saved.cycleCount || 0, linkedChapterId: saved.linkedChapterId || '' }
    }
    return {
      phase: saved.phase || 'work',
      status: saved.status === 'paused' ? 'paused' : 'idle',
      remainingMs: typeof saved.remainingMs === 'number' ? saved.remainingMs : durationMsFor(saved.phase || 'work'),
      cycleCount: saved.cycleCount || 0,
      linkedChapterId: saved.linkedChapterId || '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [phase, setPhase] = useState(initial.phase)
  const [status, setStatus] = useState(initial.status) // idle | running | paused
  const [remainingMs, setRemainingMs] = useState(initial.remainingMs)
  const [cycleCount, setCycleCount] = useState(initial.cycleCount)
  const [linkedChapterId, setLinkedChapterId] = useState(initial.linkedChapterId)
  const [showSettings, setShowSettings] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [todayStats, setTodayStats] = useState(() => getPomodoroLog()[toISODate(new Date())] || { sessions: 0, minutes: 0 })

  const endAtRef = useRef(status === 'running' ? Date.now() + initial.remainingMs : null)
  const rafRef = useRef(null)

  // A work session that completed while this page/tab wasn't open still
  // needs to be logged, exactly once, after mount.
  useEffect(() => {
    if (initial._pendingLog) {
      setTodayStats(logPomodoroSession(toISODate(new Date()), initial._pendingLog.minutes))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If durations change while idle, keep the displayed time in sync.
  useEffect(() => {
    if (status === 'idle') setRemainingMs(durationMsFor(phase))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workMin, shortBreakMin, longBreakMin])

  // Persist on every meaningful change so a refresh or a re-opened tab can
  // rebuild exactly where the timer was.
  useEffect(() => {
    saveTimerState({
      phase,
      status,
      endAt: status === 'running' ? endAtRef.current : null,
      remainingMs: status === 'running' ? null : remainingMs,
      cycleCount,
      linkedChapterId,
    })
  }, [phase, status, remainingMs, cycleCount, linkedChapterId])

  const advancePhase = useCallback(() => {
    if (phase === 'work') {
      const today = toISODate(new Date())
      const updated = logPomodoroSession(today, workMin)
      setTodayStats(updated)
      const nextCycle = cycleCount + 1
      const nextPhase = nextCycle % CYCLE_LENGTH === 0 ? 'long_break' : 'short_break'
      setCycleCount(nextCycle)
      setPhase(nextPhase)
      setRemainingMs(durationMsFor(nextPhase))
      if (soundEnabled) playChime()
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 700)
      if (autoTransition) {
        endAtRef.current = Date.now() + durationMsFor(nextPhase)
        setStatus('running')
      } else {
        setStatus('idle')
      }
    } else {
      setPhase('work')
      setRemainingMs(durationMsFor('work'))
      if (soundEnabled) playChime()
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 700)
      if (autoTransition) {
        endAtRef.current = Date.now() + durationMsFor('work')
        setStatus('running')
      } else {
        setStatus('idle')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, workMin, cycleCount, autoTransition, soundEnabled, durationMsFor])

  // Wall-clock-driven ticking: recomputed from Date.now() every animation
  // frame (throttled to ~4/sec), never from decrementing a counter — this
  // is what keeps the timer accurate through background-tab throttling.
  useEffect(() => {
    if (status !== 'running') return
    let lastTick = 0
    function tick(t) {
      if (t - lastTick > 200) {
        lastTick = t
        const left = endAtRef.current - Date.now()
        if (left <= 0) {
          setRemainingMs(0)
          advancePhase()
          return
        }
        setRemainingMs(left)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, advancePhase])

  // Re-sync immediately when the tab regains focus/visibility, so the
  // display never briefly shows stale time after switching back.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible' || status !== 'running') return
      const left = endAtRef.current - Date.now()
      if (left <= 0) {
        setRemainingMs(0)
        advancePhase()
      } else {
        setRemainingMs(left)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [status, advancePhase])

  function start() {
    endAtRef.current = Date.now() + remainingMs
    setStatus('running')
  }
  function pause() {
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()))
    setStatus('paused')
  }
  function resume() {
    endAtRef.current = Date.now() + remainingMs
    setStatus('running')
  }
  function stop() {
    setStatus('idle')
    setPhase('work')
    setCycleCount(0)
    setRemainingMs(durationMsFor('work'))
    clearTimerState()
  }
  function reset() {
    setStatus('idle')
    setRemainingMs(durationMsFor(phase))
  }

  const secondsLeft = Math.max(0, Math.round(remainingMs / 1000))
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const total = durationMsFor(phase) / 1000
  const progress = total > 0 ? 1 - secondsLeft / total : 0
  const meta = PHASE_META[phase]

  const activeChapters = useMemo(() => chapters.filter((c) => c.derivedStatus !== 'mastered'), [chapters])
  const linkedChapter = activeChapters.find((c) => c.id === linkedChapterId) || null
  const isIdle = status === 'idle' && cycleCount === 0 && phase === 'work'

  return (
    <div className="max-w-md mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10 flex flex-col items-center">
      <div className="w-full flex items-start justify-between">
        <PageHeader
          eyebrow={meta.label}
          title="Focus"
          subtitle={phase === 'work' && linkedChapter ? linkedChapter.title : undefined}
        />
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Timer settings"
          className="mt-1 h-9 w-9 flex items-center justify-center rounded-full bg-surface border border-divider shadow-elevated text-ink-soft hover:text-ink active:opacity-70 transition-colors duration-150 shrink-0"
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* cycle progress dots */}
      <div className="flex items-center gap-2 mb-6 mt-2">
        {Array.from({ length: CYCLE_LENGTH }).map((_, i) => {
          const doneInCycle = cycleCount % CYCLE_LENGTH === 0 && cycleCount > 0 ? CYCLE_LENGTH : cycleCount % CYCLE_LENGTH
          return (
            <motion.span
              key={i}
              animate={{ width: i < doneInCycle ? 24 : 6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`h-1.5 rounded-full ${i < doneInCycle ? 'bg-brand' : 'bg-divider'}`}
            />
          )
        })}
      </div>

      <motion.div
        animate={justCompleted ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-64 h-64 flex items-center justify-center mb-8"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" className="stroke-divider" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none" strokeWidth="4"
            strokeDasharray={2 * Math.PI * 45}
            animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress) }}
            strokeLinecap="round"
            className={meta.ring}
            transition={{ duration: 0.4, ease: 'linear' }}
          />
        </svg>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span className="font-display text-5xl font-semibold text-ink font-tabular tracking-tight">
              {mins}:{secs}
            </span>
            <motion.span
              key={meta.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className={`mt-2 text-[11px] font-medium uppercase tracking-wideish px-2.5 py-1 rounded-full ${meta.chip}`}
            >
              {meta.label}
            </motion.span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={reset}
          title="Reset current phase"
          className="h-11 w-11 flex items-center justify-center rounded-full bg-surface shadow-elevated text-ink-soft hover:text-ink active:opacity-70 transition-colors duration-150"
        >
          <RotateCcw size={16} />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {status === 'running' ? (
            <motion.button
              key="pause"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={pause}
              className="h-16 w-16 flex items-center justify-center rounded-full bg-brand text-white shadow-fab"
            >
              <Pause size={24} />
            </motion.button>
          ) : (
            <motion.button
              key="play"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={status === 'paused' ? resume : start}
              className="h-16 w-16 flex items-center justify-center rounded-full bg-brand text-white shadow-fab"
            >
              <Play size={24} className="ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={stop}
          title="Stop and return to the start of the cycle"
          disabled={isIdle}
          className="h-11 w-11 flex items-center justify-center rounded-full bg-surface shadow-elevated text-ink-soft hover:text-status-overdue disabled:opacity-30 transition-colors duration-150"
        >
          <Square size={15} />
        </button>
      </div>

      <div className="w-full rounded-card bg-surface border border-divider shadow-elevated p-4 mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13.5px] text-ink-soft">
          <Zap size={14} className="text-brand" /> Today
        </span>
        <span className="text-[13.5px] text-ink font-tabular">
          {todayStats.sessions} session{todayStats.sessions === 1 ? '' : 's'} · {todayStats.minutes}m focused
        </span>
      </div>

      {activeChapters.length > 0 && (
        <div className="w-full">
          <label className="block text-[13px] font-medium text-ink-soft mb-2 uppercase tracking-wide px-1">
            Studying (optional)
          </label>
          <div className="rounded-card bg-surface border border-divider shadow-elevated overflow-hidden">
            <select
              value={linkedChapterId}
              onChange={(e) => setLinkedChapterId(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-[15px] text-ink focus:outline-none"
            >
              <option value="">No chapter selected</option>
              {activeChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {subjectMap.get(c.subjectId)?.name} — {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <PomodoroSettingsSheet
            key="pomodoro-settings"
            prefs={prefs}
            updatePrefs={updatePrefs}
            isIdle={status === 'idle'}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

import { motion } from 'framer-motion'
import { Check, Pause } from 'lucide-react'
import { EASE } from './anim'

// Miniatures of the four screens that aren't the daily list. They're built from
// the same tokens as the real app — same radii, same status colours, same
// tabular numerals — so the tour shows the product rather than an illustration
// of it. Static by default; the one thing that moves is the focus ring, because
// a timer that isn't running doesn't read as a timer.

const SUBJECT_DOT = { math: '#5B7C9D', chem: '#7C6A9D', bio: '#5D8A6A' }

export function LibraryMock() {
  const groups = [
    {
      name: 'Higher Math',
      color: SUBJECT_DOT.math,
      rows: [
        { t: 'Coordinate Geometry — Circles', s: 'Due today', tone: 'due' },
        { t: 'Trigonometric Identities', s: 'Review 3 · in 6 days', tone: 'soft' },
        { t: 'Complex Numbers', s: 'Mastered', tone: 'done' },
      ],
    },
    {
      name: 'Chemistry',
      color: SUBJECT_DOT.chem,
      rows: [
        { t: 'Periodic Trends', s: 'Due today', tone: 'due' },
        { t: 'Chemical Bonding', s: 'Review 2 · in 3 days', tone: 'soft' },
      ],
    },
    {
      name: 'Biology',
      color: SUBJECT_DOT.bio,
      rows: [{ t: 'Cell Division', s: 'Review 1 · tomorrow', tone: 'soft' }],
    },
  ]

  const toneClass = {
    due: 'text-status-due bg-status-due/10',
    soft: 'text-ink-soft bg-surface-2/70',
    done: 'text-status-mastered bg-status-mastered/10',
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.name}>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: g.color }} />
            <p className="text-[11px] font-semibold uppercase tracking-wideish text-ink-soft">
              {g.name}
            </p>
            <span className="text-[11px] text-ink-soft/60 font-tabular ml-auto">{g.rows.length}</span>
          </div>
          <div className="space-y-1.5">
            {g.rows.map((r) => (
              <div
                key={r.t}
                className="flex items-center gap-3 rounded-chip bg-surface-2/40 px-3 py-2"
              >
                <p className="text-[12.5px] font-medium truncate flex-1 min-w-0">{r.t}</p>
                <span
                  className={`text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0 font-tabular ${toneClass[r.tone]}`}
                >
                  {r.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PlanMock() {
  // A week strip with two study blocks, the way the planner actually draws them.
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const blocks = [
    { day: 1, top: 8, h: 30, label: 'Organic Chem', color: SUBJECT_DOT.chem },
    { day: 3, top: 48, h: 38, label: 'Vector Algebra', color: SUBJECT_DOT.math },
    { day: 5, top: 22, h: 26, label: 'Cell Division', color: SUBJECT_DOT.bio },
  ]

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((d, i) => (
          <p
            key={d}
            className={`text-[10px] font-medium text-center ${i === 3 ? 'text-brand' : 'text-ink-soft'}`}
          >
            {d}
          </p>
        ))}
      </div>
      <div className="relative grid grid-cols-7 gap-1 h-[132px]">
        {days.map((d) => (
          <div key={d} className="rounded-chip bg-surface-2/30" />
        ))}
        {blocks.map((b) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.15 + b.day * 0.06, ease: EASE }}
            className="absolute rounded-chip overflow-hidden px-1.5 py-1"
            style={{
              left: `calc(${(b.day * 100) / 7}% + 2px)`,
              width: `calc(${100 / 7}% - 6px)`,
              top: b.top,
              height: b.h,
              backgroundColor: `${b.color}22`,
              borderLeft: `3px solid ${b.color}`,
            }}
          >
            <p className="text-[9px] font-medium leading-tight truncate text-ink">{b.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10.5px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SUBJECT_DOT.math }} />
          3 reviews Thu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-soft/40" />
          Quiet weekend
        </span>
      </div>
    </div>
  )
}

export function FocusMock() {
  const R = 34
  const C = 2 * Math.PI * R

  return (
    <div className="flex flex-col items-center py-1">
      <div className="relative h-[88px] w-[88px]">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={R} fill="none" className="stroke-surface-2" strokeWidth="5" />
          <motion.circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            className="stroke-brand"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            whileInView={{ strokeDashoffset: C * 0.32 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-[19px] font-semibold font-tabular leading-none">18:24</p>
          <p className="text-[9.5px] text-ink-soft mt-1">left</p>
        </div>
      </div>
      <p className="text-[12.5px] font-medium mt-3.5">Vector Algebra</p>
      <p className="text-[11px] text-ink-soft mt-0.5">Physics · Review 2 of 4</p>
      <div className="flex items-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-capsule bg-brand text-white text-[11px] font-medium px-3 py-1.5">
          <Pause size={11} /> Pause
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-capsule border border-divider text-[11px] font-medium px-3 py-1.5 text-ink-soft">
          <Check size={11} /> Done
        </span>
      </div>
    </div>
  )
}

export function StreakMock() {
  // Reviews cleared per day over three weeks. Deliberately imperfect — two
  // empty days, because a chart with no gaps in it isn't believable.
  const bars = [3, 4, 2, 5, 0, 2, 4, 5, 3, 4, 6, 2, 0, 3, 5, 4, 6, 3, 5, 4, 6]
  const max = Math.max(...bars)

  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        <p className="font-display text-[26px] font-semibold tracking-tight font-tabular leading-none">
          78
        </p>
        <p className="text-[11.5px] text-ink-soft">reviews cleared this month</p>
      </div>
      <div className="flex items-end gap-[3px] h-[62px] mt-4">
        {bars.map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 2 }}
            whileInView={{ height: v === 0 ? 2 : `${(v / max) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.022, ease: EASE }}
            className={`flex-1 rounded-[2px] ${v === 0 ? 'bg-surface-2' : 'bg-brand/70'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2.5 text-[10px] text-ink-soft">
        <span>3 weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

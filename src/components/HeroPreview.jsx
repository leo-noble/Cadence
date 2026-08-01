import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import AppFrame from './landing/AppFrame'
import { EASE } from './landing/anim'

// The hero visual: a faithful miniature of the Today screen — the thing a
// returning user actually sees every morning — plus the toast you get after
// ticking one off, so a first-time visitor grasps the daily loop (open,
// revise, tick) without reading a word of body copy.
const ROWS = [
  {
    title: 'Vector Algebra',
    meta: 'Physics · Review 2 of 4',
    dot: 'bg-status-overdue',
    chip: 'Overdue · 1 day',
    chipClass: 'text-status-overdue bg-status-overdue/10',
  },
  {
    title: 'Coordinate Geometry — Circles',
    meta: 'Higher Math · Review 3 of 4',
    dot: 'bg-status-due',
    chip: 'Due today',
    chipClass: 'text-status-due bg-status-due/10',
  },
  {
    title: 'Periodic Trends',
    meta: 'Chemistry · Review 1 of 4',
    dot: 'bg-status-due',
    chip: 'Due today',
    chipClass: 'text-status-due bg-status-due/10',
  },
]

export default function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: -1.4 }}
      animate={{ opacity: 1, y: 0, rotate: -1.4 }}
      whileHover={{ rotate: 0, y: -6 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
      className="relative w-full max-w-[440px] select-none"
    >
      <AppFrame label="Today">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-display text-[22px] font-semibold tracking-tight leading-none">Today</p>
            <p className="text-[12px] text-ink-soft mt-1.5">Tuesday · 3 of 4 cleared by lunch</p>
          </div>
          <span className="text-[11px] font-medium text-brand bg-brand/10 rounded-full px-2.5 py-1 font-tabular">
            3 to review
          </span>
        </div>

        {/* Progress: the list empties, which is the entire daily goal. */}
        <div className="h-1 rounded-full bg-surface-2 overflow-hidden mb-5">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: '25%' }}
            transition={{ duration: 1, delay: 1.1, ease: EASE }}
          />
        </div>

        <div className="space-y-2">
          {ROWS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: EASE }}
              className="flex items-center gap-3 rounded-control border border-divider px-3.5 py-3"
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${r.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium truncate">{r.title}</p>
                <p className="text-[11.5px] text-ink-soft truncate mt-0.5">{r.meta}</p>
              </div>
              <span
                className={`text-[10.5px] font-medium rounded-full px-2 py-0.5 shrink-0 font-tabular ${r.chipClass}`}
              >
                {r.chip}
              </span>
            </motion.div>
          ))}

          {/* One already-cleared row, so the card reads as mid-morning progress */}
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.96, ease: EASE }}
            className="flex items-center gap-3 rounded-control bg-surface-2/40 px-3.5 py-3"
          >
            <span className="h-4 w-4 rounded-full bg-brand flex items-center justify-center shrink-0">
              <Check size={10} strokeWidth={3} className="text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-ink-soft line-through truncate">
                Trigonometric Identities
              </p>
              <p className="text-[11.5px] text-ink-soft/70 truncate mt-0.5">Higher Math · Review 2 of 4</p>
            </div>
            <span className="text-[10.5px] font-medium text-ink-soft shrink-0">Done</span>
          </motion.div>
        </div>
      </AppFrame>

      {/* Confirmation toast — the moment after tapping "Mark as revised" */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 1.5 }}
        className="absolute -bottom-7 -left-3 sm:-left-10 rounded-card bg-surface border border-divider shadow-elevated px-4 py-3 flex items-center gap-3"
        style={{ rotate: '1.5deg' }}
      >
        <span className="h-7 w-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Check size={14} strokeWidth={2.5} className="text-brand" />
        </span>
        <div>
          <p className="text-[12.5px] font-medium leading-tight">Marked as revised</p>
          <p className="text-[11px] text-ink-soft mt-0.5 font-tabular">Next review · in 7 days</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

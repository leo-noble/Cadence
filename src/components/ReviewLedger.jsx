import { motion } from 'framer-motion'

// The hero visual: styled as a library index card, not a screenshot of the
// app. It shows the actual mechanic — a chapter and the fixed intervals it
// will resurface on — rather than a generic UI mockup.
const ROWS = [
  { subject: 'Physics', title: 'Vector Algebra', interval: '+1 day', dot: 'bg-status-overdue' },
  { subject: 'Higher Math', title: 'Coordinate Geometry — Circles', interval: '+7 days', dot: 'bg-status-due' },
  { subject: 'Higher Math', title: 'Trigonometric Identities', interval: '+30 days', dot: 'bg-status-upcoming' },
  { subject: 'Chemistry', title: 'Periodic Trends', interval: '+90 days', dot: 'bg-status-mastered' },
]

export default function ReviewLedger() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      whileHover={{ rotate: 0, y: -4 }}
      className="w-full max-w-sm select-none"
    >
      <div className="relative rounded-card bg-surface border border-divider shadow-sheet p-6 pt-8">
        {/* brass tab, like a card-catalog divider */}
        <div className="absolute -top-3 left-7 h-6 w-16 rounded-t-md bg-accent shadow-[0_1px_0_rgba(0,0,0,0.15)]" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display text-[19px] font-semibold text-ink tracking-tight">
              Review ledger
            </p>
            <p className="text-[12px] text-ink-soft mt-0.5">Card no. 0142 · Higher Math</p>
          </div>
          <span className="text-[11px] font-medium text-accent border border-accent/40 rounded-full px-2 py-0.5 font-tabular">
            4 filed
          </span>
        </div>

        <div className="rounded-[14px] border border-dashed border-divider divide-y divide-dashed divide-divider overflow-hidden">
          {ROWS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.12 }}
              className="flex items-center gap-3 px-3.5 py-3"
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${r.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-ink truncate">{r.title}</p>
                <p className="text-[11.5px] text-ink-soft truncate mt-0.5">{r.subject}</p>
              </div>
              <span className="text-[11px] font-tabular text-ink-soft shrink-0">{r.interval}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

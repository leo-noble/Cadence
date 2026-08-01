import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import { REVIEW_DAYS, REVIEW_GAPS, dayToFraction, formatGap } from '../lib/reviewSchedule'

// A chapter's whole life on one line. The spacing between markers is the
// message: each wait is drawn wider than the one before it, so you can see
// the gaps growing before reading a single label.

const LABELS = ['Studied', 'Review 1', 'Review 2', 'Review 3', 'Mastered']

// Keep the first and last markers off the very edges so their labels have
// room to sit centred underneath.
const LEFT = 4
const SPAN = 88
const at = (day) => LEFT + dayToFraction(day) * SPAN

// Rough heights for the stacked mobile version — same widening rhythm.
const GAP_HEIGHTS = [40, 58, 80, 132]

function Marker({ isFirst, isLast }) {
  if (isLast) {
    return (
      <span className="h-6 w-6 rounded-full bg-brand flex items-center justify-center shadow-fab">
        <Check size={13} strokeWidth={3} className="text-white" />
      </span>
    )
  }
  return (
    <span
      className={`h-3.5 w-3.5 rounded-full ring-4 ${
        isFirst ? 'bg-ink ring-ink/10' : 'bg-brand ring-brand/15'
      }`}
    />
  )
}

export default function RhythmTimeline() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref}>
      {/* ---------- Horizontal, md and up ---------- */}
      <div className="hidden md:block">
        <div className="relative h-36">
          {REVIEW_GAPS.map((gap, i) => {
            const left = at(REVIEW_DAYS[i])
            const width = at(REVIEW_DAYS[i + 1]) - left
            return (
              <div key={gap} className="absolute top-1/2" style={{ left: `${left}%`, width: `${width}%` }}>
                <motion.div
                  className="h-[2px] bg-divider origin-left"
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.3, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.42 + i * 0.3 }}
                >
                  <span className="text-xs font-medium text-ink-soft font-tabular whitespace-nowrap">
                    {formatGap(gap)}
                  </span>
                  <span className="text-[10px] text-ink-soft/60 whitespace-nowrap">later</span>
                </motion.div>
              </div>
            )
          })}

          {REVIEW_DAYS.map((day, i) => (
            <motion.div
              key={day}
              className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${at(day)}%` }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.14 + i * 0.3 }}
            >
              <div className="-translate-y-1/2 flex items-center justify-center h-6">
                <Marker isFirst={i === 0} isLast={i === REVIEW_DAYS.length - 1} />
              </div>
              <div className="mt-2 text-center">
                <p className="font-display text-[15px] font-semibold tracking-tight font-tabular whitespace-nowrap">
                  Day {day}
                </p>
                <p className="text-xs text-ink-soft mt-0.5 whitespace-nowrap">{LABELS[i]}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ---------- Vertical, below md ---------- */}
      <div className="md:hidden pl-1">
        {REVIEW_DAYS.map((day, i) => (
          <div key={day}>
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.22 }}
            >
              <div className="w-7 flex justify-center shrink-0">
                <Marker isFirst={i === 0} isLast={i === REVIEW_DAYS.length - 1} />
              </div>
              <div>
                <p className="font-display text-[15px] font-semibold tracking-tight font-tabular leading-tight">
                  Day {day}
                </p>
                <p className="text-xs text-ink-soft">{LABELS[i]}</p>
              </div>
            </motion.div>
            {i < REVIEW_GAPS.length && (
              <div className="flex items-center gap-4" style={{ height: GAP_HEIGHTS[i] }}>
                <div className="w-7 flex justify-center shrink-0 self-stretch py-1.5">
                  <motion.div
                    className="w-[2px] bg-divider origin-top"
                    initial={{ scaleY: 0 }}
                    animate={inView ? { scaleY: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.22, ease: 'easeOut' }}
                  />
                </div>
                <motion.p
                  className="text-xs font-medium text-ink-soft font-tabular"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.28 + i * 0.22 }}
                >
                  {formatGap(REVIEW_GAPS[i])} later
                </motion.p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

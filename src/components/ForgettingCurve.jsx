import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { REVIEW_DAYS, REVIEW_GAPS, dayToFraction, fractionToDay } from '../lib/reviewSchedule'

// How much of a chapter you still hold onto over its first seven weeks — once
// with no review at all, once on Cadence's schedule. The space between the two
// lines is the whole pitch, so the chart is built to make that space obvious
// at a glance and to need almost no reading.
//
// The shapes are modelled, not measured. Recall decays exponentially between
// reviews and each review resets it to full — and, crucially, each review also
// makes the next decay slower. That's DIPS: how far recall is allowed to fall
// before the next review. It rises every time, so the blue line settles into
// the top of the chart while the unreviewed line is already on the floor.

// Kept deliberately shallow and rising: the unreviewed line is above 76% for
// the whole first day, so a deeper first dip would have the blue line crossing
// *below* the red one and reading as "reviewing is worse", which is nonsense.
const DIPS = [0.82, 0.85, 0.88, 0.91]
const TAIL_STRENGTH = 400 // after the last review it barely moves

const W = 640
const H = 340
const PAD = { l: 38, r: 52, t: 30, b: 44 }
const PW = W - PAD.l - PAD.r
const PH = H - PAD.t - PAD.b

// A week of runway past the final review, so the flat "it stuck" tail shows.
const DOMAIN = 48
const LAST_REVIEW = REVIEW_DAYS[REVIEW_DAYS.length - 1]

const x = (day) => PAD.l + dayToFraction(day, DOMAIN) * PW
const y = (recall) => PAD.t + (1 - recall) * PH

// Recall with no review: a steep early drop that levels off at a small residue
// rather than falling to a true zero.
const noReview = (day) => 0.1 + 0.9 * Math.exp(-day / 3.2)

// Both curves are sampled at evenly spaced points across the *drawing*, not
// across days. The x-scale compresses day 30 onwards into a fraction of the
// width, so even-in-days sampling wastes hundreds of points out there and
// leaves the steep first day — the part with all the curvature — with three,
// which renders as visible corners.
function samplePath(fromDay, toDay, recallAt, steps) {
  const f0 = dayToFraction(fromDay, DOMAIN)
  const f1 = dayToFraction(toDay, DOMAIN)
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const day = fractionToDay(f0 + ((f1 - f0) * i) / steps, DOMAIN)
    pts.push([x(day), y(recallAt(day))])
  }
  return pts
}

const NO_REVIEW_POINTS = samplePath(0, DOMAIN, noReview, 220)

// Recall on the schedule: decay from full after each review, then a step back
// to full at the moment you sit down with it again.
function buildCadencePoints() {
  const pts = []
  REVIEW_GAPS.forEach((gap, i) => {
    const start = REVIEW_DAYS[i]
    const strength = gap / Math.log(1 / DIPS[i])
    pts.push(...samplePath(start, start + gap, (d) => Math.exp(-(d - start) / strength), 60))
    pts.push([x(start + gap), y(1)]) // the review itself
  })
  pts.push(
    ...samplePath(LAST_REVIEW, DOMAIN, (d) => Math.exp(-(d - LAST_REVIEW) / TAIL_STRENGTH), 30)
  )
  return pts
}

const toPath = (pts) => `M${pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join('L')}`
const close = (path) =>
  `${path}L${x(DOMAIN).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`

const NO_REVIEW_PATH = toPath(NO_REVIEW_POINTS)
const CADENCE_PATH = toPath(buildCadencePoints())
const CADENCE_AREA = close(CADENCE_PATH)
const NO_REVIEW_AREA = close(NO_REVIEW_PATH)

// Where each line finishes after seven weeks — the only two numbers that matter.
const END_CADENCE = Math.exp(-(DOMAIN - LAST_REVIEW) / TAIL_STRENGTH)
const END_NO_REVIEW = noReview(DOMAIN)

const GRIDS = [1, 0.5, 0]

function Legend({ label, muted }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-[3px] w-5 rounded-full ${muted ? 'bg-status-overdue/60' : 'bg-brand'}`} />
      <span className={muted ? 'text-ink-soft' : 'text-ink'}>{label}</span>
    </span>
  )
}

export default function ForgettingCurve() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const draw = inView ? { pathLength: 1 } : {}

  return (
    <div ref={ref} className="rounded-card bg-surface border border-divider shadow-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-display text-base font-semibold tracking-tight">
          How much you still remember
        </h3>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Legend label="With Cadence" />
          <Legend label="No reviews" muted />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full mt-4 overflow-visible"
        role="img"
        aria-label="Without reviews, recall drops to about ten percent within a week and stays there. With Cadence, every review returns it to full and each one holds longer, finishing near one hundred percent after seven weeks."
      >
        <defs>
          <linearGradient id="cadence-area-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Gridlines and the recall scale */}
        {GRIDS.map((g) => (
          <g key={g}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(g)}
              y2={y(g)}
              className="stroke-divider"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 9}
              y={y(g) + 4}
              textAnchor="end"
              className="fill-ink-soft font-tabular"
              fontSize="11"
            >
              {g * 100}%
            </text>
          </g>
        ))}

        {/* Tinted areas: the space between them is the argument */}
        <motion.path
          d={NO_REVIEW_AREA}
          className="fill-status-overdue/[0.07]"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
        />
        <motion.path
          d={CADENCE_AREA}
          fill="url(#cadence-area-fade)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
        />

        <motion.path
          d={NO_REVIEW_PATH}
          fill="none"
          className="stroke-status-overdue/70"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={draw}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        <motion.path
          d={CADENCE_PATH}
          fill="none"
          className="stroke-brand"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={draw}
          transition={{ duration: 1.3, delay: 0.15, ease: 'easeInOut' }}
        />

        {/* A dot at each review, where recall snaps back to full */}
        {REVIEW_DAYS.slice(1).map((day, i) => (
          <motion.circle
            key={day}
            cx={x(day)}
            cy={y(1)}
            r="4.25"
            className="fill-brand stroke-surface"
            strokeWidth="2.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 340, damping: 20, delay: 0.5 + i * 0.16 }}
          />
        ))}

        {/* Where each line ends up, in the right-hand gutter */}
        <motion.text
          x={W - PAD.r + 9}
          y={y(END_CADENCE) + 4}
          className="fill-brand font-tabular"
          fontSize="13"
          fontWeight="700"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.4 }}
        >
          {Math.round(END_CADENCE * 100)}%
        </motion.text>
        <motion.text
          x={W - PAD.r + 9}
          y={y(END_NO_REVIEW) + 4}
          className="fill-ink-soft font-tabular"
          fontSize="13"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
          {Math.round(END_NO_REVIEW * 100)}%
        </motion.text>

        {/* Days along the bottom */}
        {REVIEW_DAYS.map((day, i) => (
          <text
            key={day}
            x={x(day)}
            y={H - PAD.b + 20}
            textAnchor="middle"
            className="fill-ink-soft font-tabular"
            fontSize="11"
          >
            {i === 0 ? 'Day 0' : day}
          </text>
        ))}
      </svg>
    </div>
  )
}

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MAX_REVIEW_INDEX } from '../lib/srs'

// Illustrative, not scientific data — the shape (steep decay vs. staircase
// recovery at each review) is what matters for the story, not exact
// values. Generated from MAX_REVIEW_INDEX so it always has exactly as
// many recovery bumps as the app actually has reviews.
const CHART_WIDTH = 560
const TOP_Y = 10

function buildWithoutReviewPath() {
  // A single steep decay curve across the full width.
  return `M0,${TOP_Y} C${CHART_WIDTH * 0.14},${TOP_Y + 60} ${CHART_WIDTH * 0.32},${TOP_Y + 110} ${CHART_WIDTH * 0.57},${TOP_Y + 140} C${CHART_WIDTH * 0.79},${TOP_Y + 168} ${CHART_WIDTH},${TOP_Y + 195} ${CHART_WIDTH},${TOP_Y + 202}`
}

function buildCadencePath(segments) {
  const step = CHART_WIDTH / segments
  let path = `M0,${TOP_Y}`
  for (let i = 0; i < segments; i++) {
    const start = i * step
    const dipX = start + step * 0.72
    const end = start + step
    const dipY = TOP_Y + 62 + i * 2 // dips settle a touch deeper each time, then recover
    path += ` C${start + step * 0.3},${TOP_Y + dipY * 0.55} ${dipX - step * 0.08},${dipY} ${dipX},${dipY}`
    path += ` L${dipX},${dipY}`
    path += ` C${dipX + step * 0.05},${TOP_Y + (dipY - TOP_Y) * 0.35} ${end - step * 0.08},${TOP_Y + i * 2} ${end},${TOP_Y + i * 2}`
  }
  return path
}

function buildMarkers(segments) {
  const step = CHART_WIDTH / segments
  const markers = [{ x: 0, label: 'Day 0' }]
  for (let i = 1; i <= segments; i++) {
    markers.push({ x: i * step, label: `R${i}` })
  }
  return markers
}

const WITHOUT_REVIEW = buildWithoutReviewPath()
const WITH_CADENCE = buildCadencePath(MAX_REVIEW_INDEX)
const MARKERS = buildMarkers(MAX_REVIEW_INDEX)

export default function ForgettingCurve() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="rounded-card bg-surface border border-divider shadow-elevated p-6">
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <span className="w-4 h-0 border-t-2 border-dashed border-status-overdue/60 inline-block" />
          Without review
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
          <span className="h-0.5 w-4 bg-brand inline-block rounded-full" />
          With Cadence
        </span>
      </div>

      <svg viewBox="-10 -10 580 240" className="w-full h-auto" preserveAspectRatio="none">
        {/* baseline grid */}
        {[0, 55, 110, 165, 212].map((y) => (
          <line key={y} x1="0" y1={y} x2="560" y2={y} className="stroke-divider" strokeWidth="1" />
        ))}

        {/* without review — steep decay */}
        <motion.path
          d={WITHOUT_REVIEW}
          fill="none"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          className="stroke-status-overdue/70"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />

        {/* with cadence — staircase recovery at each review */}
        <motion.path
          d={WITH_CADENCE}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-brand"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.15 }}
        />

        {/* review markers */}
        {MARKERS.slice(1).map((m, i) => (
          <motion.circle
            key={m.x}
            cx={m.x}
            cy={TOP_Y + i * 2}
            r="4"
            className="fill-brand"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.15 }}
          />
        ))}
      </svg>

      <div className="flex justify-between mt-1 px-0.5">
        {MARKERS.map((m) => (
          <span key={m.label} className="text-[10px] text-ink-soft font-tabular">
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}

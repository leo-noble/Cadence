import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function SegmentedControl({ options, value, onChange, layoutId, className = '' }) {
  // The pill slides between options via a shared-layout animation, which
  // measures against wherever this layoutId was last seen. On the first
  // render after the page mounts that reference is stale — a box left over
  // from the page's exit transition, when it was lifted out of normal flow —
  // so the pill flies in from off-position. Holding the layoutId back for a
  // frame lets it register where it actually sits; sliding works from there.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={`inline-flex items-center gap-0.5 p-0.5 rounded-control bg-divider/60 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className="relative px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors duration-150 hover:text-ink"
        >
          {value === opt.id && (
            <motion.span
              layoutId={settled ? layoutId : undefined}
              className="absolute inset-0 rounded-[8px] bg-surface shadow-elevated"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <span className={`relative ${value === opt.id ? 'text-ink' : 'text-ink-soft'}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}

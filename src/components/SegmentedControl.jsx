import { motion } from 'framer-motion'

export default function SegmentedControl({ options, value, onChange, layoutId, className = '' }) {
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
              layoutId={layoutId}
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

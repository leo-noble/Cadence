import { motion } from 'framer-motion'

// Shared header treatment for every app screen: a small tracked eyebrow
// in the accent gold, a large serif title, and a thin gradient rule.
// This is the one repeated signature that ties Dashboard/Library/
// Calendar/Focus/Settings together as one design system.
export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wideish text-brand mb-1.5">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[32px] md:text-[34px] leading-tight font-semibold text-ink tracking-tightest">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[14px] text-ink-soft mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
      <div className="h-px w-14 bg-brand mt-4 rounded-full" />
    </motion.div>
  )
}

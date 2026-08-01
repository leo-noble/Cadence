import { motion } from 'framer-motion'

// The chrome every product mock on the landing page sits inside, so all of
// them read as the same app rather than as unrelated illustrations. The three
// dots are the only skeuomorphic thing here — enough to say "this is a real
// screen", not so much that it becomes a drawing of macOS.
export default function AppFrame({ children, label, className = '', tilt = false }) {
  return (
    <motion.div
      whileHover={tilt ? { rotateX: 0, rotateY: 0, y: -6 } : undefined}
      transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      style={
        tilt
          ? { transformPerspective: 1400, rotateX: 6, rotateY: -9, transformStyle: 'preserve-3d' }
          : undefined
      }
      className={`rounded-card bg-surface border border-divider shadow-sheet overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 px-4 h-9 bg-surface-2/50">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-ink/15" />
          <span className="h-2 w-2 rounded-full bg-ink/15" />
          <span className="h-2 w-2 rounded-full bg-ink/15" />
        </span>
        {label && (
          <span className="ml-1.5 text-[11px] font-medium text-ink-soft tracking-tight">{label}</span>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </motion.div>
  )
}

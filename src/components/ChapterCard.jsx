import { motion } from 'framer-motion'
import { Check, Clock, Lock, ChevronRight, AlertCircle } from 'lucide-react'
import { statusColor, statusLabel } from './StatusChip'
import { daysBetween } from '../lib/srs'

export default function ChapterCard({ chapter, subject, onOpen, onRevise, onSnooze }) {
  const daysDiff = chapter.nextReviewDate ? daysBetween(new Date(), chapter.nextReviewDate) : null
  const isActionable = chapter.derivedStatus === 'due' || chapter.derivedStatus === 'overdue'
  const isUpcoming = chapter.derivedStatus === 'upcoming'

  let subtext = statusLabel(chapter.derivedStatus)
  if (chapter.status !== 'mastered') {
    if (daysDiff < 0) subtext += ` · ${Math.abs(daysDiff)}d ago`
    else if (daysDiff > 0) subtext += ` · in ${daysDiff}d`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div
        className="group relative flex items-center gap-3.5 bg-surface hover:bg-paper/70 active:bg-paper pl-4 pr-4 py-3.5 cursor-pointer transition-colors duration-150"
        onClick={() => onOpen?.(chapter)}
      >
        <span className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full shrink-0 ${statusColor(chapter.derivedStatus)}`} />

        <div className="min-w-0 flex-1 pl-2">
          <div className="flex items-center gap-1.5">
            <p className="text-[15px] text-ink truncate">{chapter.title}</p>
            {chapter.struggleFlag && <AlertCircle size={13} className="text-status-overdue shrink-0" />}
          </div>
          <p className="text-[13px] text-ink-soft truncate mt-0.5">
            {subject?.name || 'No subject'} · {subtext}
          </p>
        </div>

        {isActionable ? (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onSnooze?.(chapter)}
              title="Snooze 1 day"
              className="p-2 rounded-full text-ink-soft hover:bg-paper active:bg-paper transition-colors duration-150"
            >
              <Clock size={17} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onRevise?.(chapter)}
              title="Mark as revised"
              className="p-2 rounded-full text-brand hover:bg-brand/10 active:bg-brand/10 transition-colors duration-150"
            >
              <Check size={19} strokeWidth={2.5} />
            </motion.button>
          </div>
        ) : isUpcoming ? (
          <Lock size={14} className="text-ink-soft/40 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-ink-soft/50 shrink-0" />
        )}
      </div>
    </motion.div>
  )
}

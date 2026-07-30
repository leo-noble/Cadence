import { motion } from 'framer-motion'
import { X, Check, Clock, AlertCircle, Trash2, Lock } from 'lucide-react'
import StatusChip from './StatusChip'
import Grabber from './Grabber'
import { buildTimeline, isDueOrOverdue, daysBetween } from '../lib/srs'

const TIMELINE_DOT = {
  done: 'bg-status-mastered',
  next: 'bg-brand',
  upcoming: 'bg-divider',
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const sheetVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30, transition: { duration: 0.18 } },
}

export default function ChapterDetailSheet({
  chapter,
  subject,
  onClose,
  onRevise,
  onSnooze,
  onStruggle,
  onMasterEarly,
  onDelete,
}) {
  if (!chapter) return null
  const timeline = buildTimeline(chapter)
  const isMastered = chapter.status === 'mastered'
  const canAct = isDueOrOverdue(chapter)
  const daysUntilDue = chapter.nextReviewDate ? daysBetween(new Date(), chapter.nextReviewDate) : null

  return (
    <motion.div
      key="backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        key="sheet"
        variants={sheetVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-lg max-h-[88vh] overflow-y-auto bg-surface rounded-t-card md:rounded-card shadow-sheet pb-[env(safe-area-inset-bottom)]"
      >
        <Grabber />

        <div className="relative px-6 pt-2 pb-6">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute right-4 top-2 z-10 h-9 w-9 -m-1 rounded-full bg-divider flex items-center justify-center text-ink-soft active:opacity-60"
          >
            <X size={15} strokeWidth={2.5} />
          </button>

          <div className="pr-8 mb-1">
            <div className="flex items-center gap-2 mb-1">
              {subject && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: subject.colorTag }} />}
              <span className="text-[13px] text-ink-soft">{subject?.name}</span>
            </div>
            <h2 className="font-display text-[22px] font-bold text-ink leading-snug tracking-tight">
              {chapter.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 mt-2 mb-5">
            <StatusChip status={chapter.derivedStatus} />
            {chapter.struggleFlag && (
              <span className="inline-flex items-center gap-1 text-[13px] text-status-overdue">
                <AlertCircle size={12} /> Flagged as needing extra attention
              </span>
            )}
          </div>

          {chapter.notes && (
            <p className="text-[15px] text-ink-soft mb-5 whitespace-pre-wrap">{chapter.notes}</p>
          )}

          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft mb-2">
            Review timeline
          </h3>
          <div className="rounded-card bg-paper px-4 py-1 mb-6">
            <ol>
              {timeline.map((t, i) => (
                <li key={t.reviewNumber} className={`flex items-center gap-3 py-2.5 ${i < timeline.length - 1 ? 'border-b border-divider' : ''}`}>
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${TIMELINE_DOT[t.state]}`} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-[15px] flex items-center gap-1.5 ${t.state === 'next' ? 'font-medium text-ink' : 'text-ink-soft'}`}>
                      Review {t.reviewNumber}
                      {t.state === 'next' && !canAct && <Lock size={11} className="opacity-60" />}
                    </span>
                    <span className="text-[13px] text-ink-soft font-tabular">{t.date}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {isMastered ? (
            <div className="rounded-control bg-status-mastered/10 text-center py-4 mb-1">
              <p className="text-[15px] font-medium text-status-mastered">You've fully retained this chapter. Nice work.</p>
            </div>
          ) : canAct ? (
            <div className="space-y-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onRevise(chapter); onClose() }}
                className="w-full flex items-center justify-center gap-2 rounded-capsule bg-brand text-white font-medium py-3 text-[15px]"
              >
                <Check size={16} /> Mark as revised
              </motion.button>
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSnooze(chapter)}
                  className="flex items-center justify-center gap-2 rounded-control border border-divider text-ink font-medium py-2.5 text-[14px]"
                >
                  <Clock size={15} /> Snooze 1 day
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onStruggle(chapter)}
                  className="flex items-center justify-center gap-2 rounded-control border border-divider text-ink font-medium py-2.5 text-[14px]"
                >
                  <AlertCircle size={15} /> Struggled
                </motion.button>
              </div>
              <button
                onClick={() => { onMasterEarly(chapter); onClose() }}
                className="w-full text-center py-1.5 text-[13px] text-ink-soft active:text-brand transition-colors duration-150"
              >
                I know this cold — end the review cycle early
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-control bg-paper px-4 py-3.5 mb-1">
              <Lock size={16} className="text-ink-soft mt-0.5 shrink-0" />
              <p className="text-[14px] text-ink-soft leading-relaxed">
                This review isn't due yet — it unlocks in{' '}
                <span className="font-medium text-ink font-tabular">{daysUntilDue}</span>{' '}
                day{daysUntilDue === 1 ? '' : 's'}, on{' '}
                <span className="font-medium text-ink font-tabular">{chapter.nextReviewDate}</span>.
                Reviewing early won't hold up as well, so Cadence keeps it locked until then.
              </p>
            </div>
          )}

          <button
            onClick={() => { onDelete(chapter.id); onClose() }}
            className="w-full flex items-center justify-center gap-2 mt-4 text-[13px] text-ink-soft active:text-status-overdue transition-colors duration-180"
          >
            <Trash2 size={13} /> Delete chapter
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

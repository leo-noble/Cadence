import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2 } from 'lucide-react'
import ChapterCard from '../components/ChapterCard'
import TodayHero from '../components/TodayHero'

export default function Dashboard({ cadence, profile, onOpenChapter, onAddChapter }) {
  const { overdue, dueToday, subjectMap, streak, events, chapters, reviseChapter, snoozeChapterAction } = cadence
  const [snoozeBlocked, setSnoozeBlocked] = useState(null) // { id, title }

  const nothingDue = overdue.length === 0 && dueToday.length === 0

  function handleSnooze(chapter) {
    const { blocked } = snoozeChapterAction(chapter)
    if (blocked) {
      setSnoozeBlocked({ id: chapter.id, title: chapter.title })
      setTimeout(() => setSnoozeBlocked(null), 2600)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
      <TodayHero profile={profile} streakCount={streak.count} events={events} chapters={chapters} />

      {nothingDue ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center py-16 rounded-card border border-dashed border-divider"
        >
          <div className="h-11 w-11 rounded-full bg-brand/10 flex items-center justify-center mb-4">
            <CheckCircle2 size={20} className="text-brand" />
          </div>
          <p className="font-display text-xl font-semibold text-ink mb-1.5">Nothing due today.</p>
          <p className="text-[15px] text-ink-soft mb-6">Go build something.</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onAddChapter}
            className="inline-flex items-center gap-2 rounded-capsule bg-brand text-white font-medium px-5 py-2.5 text-[15px]"
          >
            <Plus size={16} /> Add a chapter
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-7">
          {overdue.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-status-overdue mb-2 px-1">
                Overdue · {overdue.length}
              </h2>
              <div className="rounded-card bg-surface border border-divider divide-y divide-divider overflow-hidden shadow-elevated">
                <AnimatePresence initial={false}>
                  {overdue.map((c) => (
                    <ChapterCard
                      key={c.id}
                      chapter={c}
                      subject={subjectMap.get(c.subjectId)}
                      onOpen={onOpenChapter}
                      onRevise={reviseChapter}
                      onSnooze={handleSnooze}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {dueToday.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-status-due mb-2 px-1">
                Due today · {dueToday.length}
              </h2>
              <div className="rounded-card bg-surface border border-divider divide-y divide-divider overflow-hidden shadow-elevated">
                <AnimatePresence initial={false}>
                  {dueToday.map((c) => (
                    <ChapterCard
                      key={c.id}
                      chapter={c}
                      subject={subjectMap.get(c.subjectId)}
                      onOpen={onOpenChapter}
                      onRevise={reviseChapter}
                      onSnooze={handleSnooze}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          <AnimatePresence>
            {snoozeBlocked && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[13px] text-status-overdue px-1"
              >
                "{snoozeBlocked.title}" has already been snoozed twice — better to just knock it out.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

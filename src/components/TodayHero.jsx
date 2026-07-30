import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { toISODate, addDays } from '../lib/srs'

// The Dashboard's signature element. Uses the current theme's own panel
// gradient (subtle in Slate/Forest, a quiet multi-color sweep in
// Aurora) rather than a fixed hardcoded look — so it stays a genuine part
// of whichever theme and mode is active instead of an oddity that never changes.
export default function TodayHero({ profile, streakCount, events, chapters }) {
  const stats = useMemo(() => {
    const today = new Date()
    const weekAgoStr = toISODate(addDays(today, -7))
    const revisedThisWeek = events.filter((e) => e.action === 'completed' && e.completedDate >= weekAgoStr).length
    const overdueCount = chapters.filter((c) => c.derivedStatus === 'overdue').length
    return { revisedThisWeek, overdueCount }
  }, [events, chapters])

  const showInsight = stats.revisedThisWeek > 0 || stats.overdueCount > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-card border border-divider shadow-elevated mb-6 panel-gradient"
    >
      <div className="relative px-6 py-6 md:px-7 md:py-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wideish text-accent mb-1.5">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-display text-[30px] md:text-[34px] leading-tight font-semibold text-ink tracking-tightest">
              {profile?.name ? `Hi, ${profile.name.split(' ')[0]}` : 'Today'}
            </h1>
          </div>

          {streakCount > 0 && (
            <div className="shrink-0 flex flex-col items-center justify-center h-16 w-16 rounded-full border border-accent/40 bg-surface-2">
              <Flame size={14} className="text-accent mb-0.5" />
              <span className="font-display text-lg font-semibold text-ink font-tabular leading-none">{streakCount}</span>
              <span className="text-[9px] text-ink-soft leading-none mt-0.5">day{streakCount === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>

        {showInsight && (
          <>
            <div className="h-px bg-divider my-5" />
            <p className="text-[14px] text-ink-soft leading-relaxed">
              You revised{' '}
              <span className="font-display font-semibold font-tabular text-ink">{stats.revisedThisWeek}</span>{' '}
              chapter{stats.revisedThisWeek === 1 ? '' : 's'} this week
              {stats.overdueCount > 0 && (
                <>
                  , <span className="font-display font-semibold font-tabular text-status-overdue">{stats.overdueCount}</span>{' '}
                  {stats.overdueCount === 1 ? 'is' : 'are'} overdue
                </>
              )}
              .
            </p>
          </>
        )}
      </div>
    </motion.div>
  )
}

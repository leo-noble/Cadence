import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Target, Layers } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { toISODate, MAX_REVIEW_INDEX } from '../lib/srs'

function last30Days() {
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(toISODate(d))
  }
  return days
}

export default function StatsPage({ cadence }) {
  const { subjects, chapters, events, streak } = cadence

  const retention = useMemo(() => {
    const completed = events.filter((e) => e.action === 'completed').length
    const struggled = events.filter((e) => e.action === 'struggled').length
    const total = completed + struggled
    return total === 0 ? null : Math.round((completed / total) * 100)
  }, [events])

  const activity = useMemo(() => {
    const days = last30Days()
    const counts = new Map(days.map((d) => [d, 0]))
    events.forEach((e) => {
      if (e.action === 'completed' && counts.has(e.completedDate)) {
        counts.set(e.completedDate, counts.get(e.completedDate) + 1)
      }
    })
    const max = Math.max(1, ...counts.values())
    return days.map((d) => ({ date: d, count: counts.get(d), pct: counts.get(d) / max }))
  }, [events])

  const bySubject = useMemo(() => {
    return subjects
      .map((s) => {
        const subjectChapters = chapters.filter((c) => c.subjectId === s.id)
        const mastered = subjectChapters.filter((c) => c.status === 'mastered').length
        const totalProgress = subjectChapters.reduce(
          (sum, c) => sum + (c.status === 'mastered' ? MAX_REVIEW_INDEX : c.currentReviewIndex || 0),
          0
        )
        const maxProgress = subjectChapters.length * MAX_REVIEW_INDEX
        return {
          ...s,
          count: subjectChapters.length,
          mastered,
          pct: maxProgress === 0 ? 0 : Math.round((totalProgress / maxProgress) * 100),
        }
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [subjects, chapters])

  const totalCompleted = events.filter((e) => e.action === 'completed').length

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
      <PageHeader eyebrow="Your progress" title="Stats" />

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="rounded-card bg-surface border border-divider shadow-elevated p-4">
          <Flame size={16} className="text-brand mb-2" />
          <p className="font-display text-2xl font-semibold text-ink font-tabular">{streak.count}</p>
          <p className="text-[12px] text-ink-soft mt-0.5">day streak</p>
        </div>
        <div className="rounded-card bg-surface border border-divider shadow-elevated p-4">
          <Target size={16} className="text-brand mb-2" />
          <p className="font-display text-2xl font-semibold text-ink font-tabular">
            {retention === null ? '—' : `${retention}%`}
          </p>
          <p className="text-[12px] text-ink-soft mt-0.5">retention rate</p>
        </div>
        <div className="rounded-card bg-surface border border-divider shadow-elevated p-4">
          <Layers size={16} className="text-brand mb-2" />
          <p className="font-display text-2xl font-semibold text-ink font-tabular">{totalCompleted}</p>
          <p className="text-[12px] text-ink-soft mt-0.5">reviews done</p>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-divider shadow-elevated p-5 mb-6">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft mb-4">Last 30 days</p>
        <div className="flex items-end gap-[3px] h-20">
          {activity.map((d, i) => (
            <motion.div
              key={d.date}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(0.06, d.pct) }}
              transition={{ duration: 0.4, delay: i * 0.01, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'bottom' }}
              title={`${d.date}: ${d.count} review${d.count === 1 ? '' : 's'}`}
              className={`flex-1 rounded-[2px] ${d.count > 0 ? 'bg-brand' : 'bg-divider'}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-card bg-surface border border-divider shadow-elevated overflow-hidden divide-y divide-divider">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft px-5 pt-4 pb-3">
          Subject breakdown
        </p>
        {bySubject.length === 0 && (
          <p className="text-[14px] text-ink-soft px-5 py-4">Add a chapter to see your breakdown here.</p>
        )}
        {bySubject.map((s) => (
          <div key={s.id} className="px-5 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14.5px] font-medium text-ink">{s.name}</span>
              <span className="text-[12.5px] text-ink-soft font-tabular">
                {s.mastered}/{s.count} mastered
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-divider overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-brand"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, X } from 'lucide-react'
import ChapterCard from '../components/ChapterCard'
import SegmentedControl from '../components/SegmentedControl'
import PageHeader from '../components/PageHeader'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due', label: 'Due' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'mastered', label: 'Mastered' },
]

export default function LibraryPage({ cadence, onOpenChapter, onAddChapter }) {
  const { subjects, chapters, subjectMap, reviseChapter, snoozeChapterAction, removeSubject } = cadence
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [snoozeBlocked, setSnoozeBlocked] = useState(null)

  function handleSnooze(chapter) {
    const { blocked } = snoozeChapterAction(chapter)
    if (blocked) {
      setSnoozeBlocked({ id: chapter.id, title: chapter.title })
      setTimeout(() => setSnoozeBlocked(null), 2600)
    }
  }

  const bySubject = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = chapters.filter((c) => {
      if (filter !== 'all' && c.derivedStatus !== filter) return false
      if (!q) return true
      const subjectName = subjectMap.get(c.subjectId)?.name || ''
      return c.title.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q)
    })
    const groups = new Map()
    subjects.forEach((s) => groups.set(s.id, []))
    filtered.forEach((c) => {
      if (!groups.has(c.subjectId)) groups.set(c.subjectId, [])
      groups.get(c.subjectId).push(c)
    })
    return groups
  }, [subjects, chapters, filter, query, subjectMap])

  const hasAnyVisible = useMemo(() => Array.from(bySubject.values()).some((list) => list.length > 0), [bySubject])

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10 pb-28 md:pb-10">
      <PageHeader
        eyebrow={`${subjects.length} subject${subjects.length === 1 ? '' : 's'}`}
        title="Library"
        action={
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onAddChapter}
            className="inline-flex items-center gap-1.5 rounded-capsule bg-brand text-white font-medium px-3.5 py-2 text-sm"
          >
            <Plus size={15} /> Add
          </motion.button>
        }
      />

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters or subjects"
          className="w-full rounded-control bg-surface border border-divider shadow-elevated pl-10 pr-9 py-2.5 text-[14px] text-ink placeholder:text-ink-soft focus:outline-none focus:border-brand transition-colors duration-150"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="overflow-x-auto mb-6 -mx-4 px-4 md:mx-0 md:px-0">
        <SegmentedControl
          layoutId="library-filter-pill"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {subjects.length === 0 ? (
        <p className="text-[15px] text-ink-soft text-center py-16">
          No subjects yet. Add your first chapter to get started.
        </p>
      ) : !hasAnyVisible ? (
        <p className="text-[15px] text-ink-soft text-center py-16">
          {
            {
              overdue: 'Nothing overdue \u2014 you\u2019re all caught up.',
              due: 'Nothing due today.',
              upcoming: 'Nothing upcoming yet.',
              mastered: 'Nothing mastered yet \u2014 keep going.',
            }[filter] || 'No chapters yet. Add one to get started.'
          }
        </p>
      ) : (
        <div className="space-y-7">
          {subjects.map((subject) => {
            const list = bySubject.get(subject.id) || []
            if (list.length === 0) return null
            return (
              <section key={subject.id}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.colorTag }} />
                    <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">
                      {subject.name} · {list.length}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${subject.name}" and all its chapters?`)) removeSubject(subject.id)
                    }}
                    className="p-1 text-ink-soft active:text-status-overdue transition-colors duration-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="rounded-card bg-surface border border-divider divide-y divide-divider overflow-hidden shadow-elevated">
                  <AnimatePresence initial={false}>
                    {list.map((c) => (
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
              </section>
            )
          })}

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

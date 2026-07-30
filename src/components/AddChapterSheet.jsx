import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Grabber from './Grabber'
import { toISODate } from '../lib/srs'

const TITLE_MAX = 120
const NOTES_MAX = 1000
const todayISO = () => toISODate(new Date())

export default function AddChapterSheet({ subjects, onClose, onCreateSubject, onCreateChapter }) {
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [showNewSubject, setShowNewSubject] = useState(subjects.length === 0)
  const [notes, setNotes] = useState('')
  const [studiedDate, setStudiedDate] = useState(todayISO)
  const [expanded, setExpanded] = useState(false)

  const trimmedTitle = title.trim()
  const trimmedNewSubject = newSubjectName.trim()
  const canSubmit = trimmedTitle.length > 0 && (subjectId || trimmedNewSubject)

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    let finalSubjectId = subjectId
    if (showNewSubject && trimmedNewSubject) {
      const s = onCreateSubject({ name: trimmedNewSubject.slice(0, TITLE_MAX) })
      finalSubjectId = s.id
    }
    // Never let a chapter be "studied" in the future — it would schedule
    // reviews from a date that hasn't happened yet.
    const safeDate = studiedDate > todayISO() ? todayISO() : studiedDate
    onCreateChapter({
      subjectId: finalSubjectId,
      title: trimmedTitle.slice(0, TITLE_MAX),
      notes: notes.trim().slice(0, NOTES_MAX),
      studiedDate: safeDate,
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30, transition: { duration: 0.18 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full md:max-w-md bg-surface rounded-t-card md:rounded-card shadow-sheet pb-[env(safe-area-inset-bottom)]"
      >
        <Grabber />

        <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
          <button type="button" onClick={onClose} className="text-[17px] text-brand active:opacity-50">
            Cancel
          </button>
          <h2 className="font-display text-[17px] font-semibold text-ink">New Chapter</h2>
          <button
            type="submit"
            disabled={!canSubmit}
            className="text-[17px] font-semibold text-brand disabled:opacity-30 active:opacity-50"
          >
            Add
          </button>
        </div>

        <div className="p-4">
          <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Title</label>
          <input
            autoFocus
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Trigonometric Identities"
            className="w-full mb-4 rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/40 transition-shadow duration-180"
          />

          <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Subject</label>
          {!showNewSubject ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-capsule text-[13px] font-medium border transition duration-180 ${
                    subjectId === s.id
                      ? 'border-brand text-brand bg-brand/10'
                      : 'border-divider text-ink-soft'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.colorTag }} />
                  {s.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewSubject(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-capsule text-[13px] font-medium border border-dashed border-divider text-ink-soft"
              >
                <Plus size={12} /> New subject
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <input
                value={newSubjectName}
                maxLength={TITLE_MAX}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="Subject name"
                className="flex-1 rounded-control border border-divider bg-paper px-3.5 py-2 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              {subjects.length > 0 && (
                <button type="button" onClick={() => setShowNewSubject(false)} className="text-[13px] text-ink-soft px-2">
                  Cancel
                </button>
              )}
            </div>
          )}

          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-[13px] text-brand font-medium mb-1"
            >
              Add notes or a different studied date
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea
                  value={notes}
                  maxLength={NOTES_MAX}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-ink-soft mb-1.5 uppercase tracking-wide">Studied on</label>
                <input
                  type="date"
                  value={studiedDate}
                  max={todayISO()}
                  onChange={(e) => setStudiedDate(e.target.value)}
                  className="w-full rounded-control border border-divider bg-paper px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>
            </div>
          )}
        </div>
      </motion.form>
    </motion.div>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as store from './storage'
import { pullCloudData, pushCloudDataDebounced } from './cloudSync'
import {
  deriveStatus,
  isDueOrOverdue,
  markRevised,
  snoozeChapter,
  markStruggled,
  masterEarly,
  nextReviewDateForIndex,
  toISODate,
  MAX_REVIEW_INDEX,
} from './srs'

export function useCadence(userId) {
  const [subjects, setSubjects] = useState(() => store.getSubjects())
  const [chapters, setChapters] = useState(() => {
    store.migrateScheduleIfNeeded()
    return store.getChapters()
  })
  const [events, setEvents] = useState(() => store.getEvents())
  const [prefs, setPrefs] = useState(() => store.getPrefs())
  const [streak, setStreak] = useState(() => store.getStreakData())
  const [justMastered, setJustMastered] = useState(null) // chapter id, for celebration

  useEffect(() => { store.saveSubjects(subjects) }, [subjects])
  useEffect(() => { store.saveChapters(chapters) }, [chapters])
  useEffect(() => { store.saveEvents(events) }, [events])
  useEffect(() => { store.savePrefs(prefs) }, [prefs])
  useEffect(() => { store.saveStreakData(streak) }, [streak])

  // ---- cloud sync (multi-device) ----
  // On sign-in: if this browser has no chapters/subjects yet, pull whatever
  // this account already has in the cloud (new-device bootstrap). Either
  // way, every subsequent local change gets pushed up, debounced, so the
  // next device to sign in sees it.
  const pulledForUser = useRef(null)
  useEffect(() => {
    if (!userId || pulledForUser.current === userId) return
    pulledForUser.current = userId
    const isLocalEmpty = store.getSubjects().length === 0 && store.getChapters().length === 0
    if (!isLocalEmpty) return
    pullCloudData(userId).then((remote) => {
      if (!remote) return
      if (Array.isArray(remote.subjects)) { store.saveSubjects(remote.subjects); setSubjects(remote.subjects) }
      if (Array.isArray(remote.chapters)) { store.saveChapters(remote.chapters); setChapters(remote.chapters) }
      if (Array.isArray(remote.events)) { store.saveEvents(remote.events); setEvents(remote.events) }
      if (remote.streak) { store.saveStreakData(remote.streak); setStreak(remote.streak) }
    })
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    pushCloudDataDebounced(userId, { subjects, chapters, events, streak, prefs, timezone })
  }, [userId, subjects, chapters, events, streak, prefs])

  const refreshAll = useCallback(() => {
    setSubjects(store.getSubjects())
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    setPrefs(store.getPrefs())
    setStreak(store.getStreakData())
  }, [])

  // ---- derived ----
  const chaptersWithStatus = useMemo(
    () => chapters.map((c) => ({ ...c, derivedStatus: deriveStatus(c) })),
    [chapters]
  )

  const dueAndOverdue = useMemo(
    () =>
      chaptersWithStatus
        .filter((c) => c.derivedStatus === 'overdue' || c.derivedStatus === 'due')
        .sort((a, b) => (a.nextReviewDate < b.nextReviewDate ? -1 : 1)),
    [chaptersWithStatus]
  )

  const overdue = useMemo(() => dueAndOverdue.filter((c) => c.derivedStatus === 'overdue'), [dueAndOverdue])
  const dueToday = useMemo(() => dueAndOverdue.filter((c) => c.derivedStatus === 'due'), [dueAndOverdue])
  const struggling = useMemo(() => chaptersWithStatus.filter((c) => c.struggleFlag && c.status !== 'mastered'), [chaptersWithStatus])

  const subjectMap = useMemo(() => {
    const m = new Map()
    subjects.forEach((s) => m.set(s.id, s))
    return m
  }, [subjects])

  // ---- streak maintenance ----
  const bumpStreakIfDone = useCallback(() => {
    const today = toISODate(new Date())
    const stillDue = store.getChapters().some((c) => isDueOrOverdue(c))
    setStreak((prev) => {
      if (stillDue) return prev
      if (prev.lastCompletedDay === today) return prev
      const yesterday = toISODate(new Date(Date.now() - 86400000))
      const count = prev.lastCompletedDay === yesterday ? prev.count + 1 : 1
      return { count, lastCompletedDay: today }
    })
  }, [])

  // ---- subject actions ----
  const createSubject = useCallback((payload) => {
    const s = store.addSubject(payload)
    setSubjects(store.getSubjects())
    return s
  }, [])

  const removeSubject = useCallback((id) => {
    store.deleteSubject(id)
    refreshAll()
  }, [refreshAll])

  // ---- chapter actions ----
  const createChapter = useCallback(({ subjectId, title, notes, studiedDate }) => {
    const sd = studiedDate || toISODate(new Date())
    const chapter = {
      id: store.uid(),
      subjectId,
      title,
      notes: notes || '',
      studiedDate: sd,
      currentReviewIndex: 0,
      nextReviewDate: nextReviewDateForIndex(sd, 0),
      status: 'active',
      struggleFlag: false,
      snoozeStreak: 0,
      createdAt: new Date().toISOString(),
    }
    store.upsertChapter(chapter)
    setChapters(store.getChapters())
    return chapter
  }, [])

  const updateChapter = useCallback((chapter) => {
    store.upsertChapter(chapter)
    setChapters(store.getChapters())
  }, [])

  const removeChapter = useCallback((id) => {
    store.deleteChapter(id)
    refreshAll()
  }, [refreshAll])

  const reviseChapter = useCallback((chapter) => {
    // Guard: a review can only be completed once it's actually due or overdue.
    // This is enforced here (not just hidden in the UI) so a chapter can never
    // skip ahead of its own schedule — e.g. completing the day-7 review while
    // the day-3 review hasn't happened yet.
    if (!isDueOrOverdue(chapter)) return { blocked: true }
    const wasLast = chapter.currentReviewIndex === MAX_REVIEW_INDEX - 1
    const updated = markRevised(chapter)
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'completed' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    bumpStreakIfDone()
    if (wasLast) setJustMastered(chapter.id)
    return { blocked: false, chapter: updated }
  }, [bumpStreakIfDone])

  const snoozeChapterAction = useCallback((chapter) => {
    if (!isDueOrOverdue(chapter)) return { blocked: true, reason: 'not-due' }
    const { chapter: updated, blocked } = snoozeChapter(chapter)
    if (blocked) return { blocked: true, reason: 'snooze-cap' }
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'snoozed' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    return { blocked: false }
  }, [])

  const struggleChapterAction = useCallback((chapter) => {
    if (!isDueOrOverdue(chapter)) return { blocked: true }
    const updated = markStruggled(chapter)
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'struggled' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    return { blocked: false }
  }, [])

  const masterEarlyAction = useCallback((chapter) => {
    if (!isDueOrOverdue(chapter)) return { blocked: true }
    const updated = masterEarly(chapter)
    store.upsertChapter(updated)
    store.logEvent({ chapterId: chapter.id, scheduledDate: chapter.nextReviewDate, action: 'skipped_ahead' })
    setChapters(store.getChapters())
    setEvents(store.getEvents())
    bumpStreakIfDone()
    setJustMastered(chapter.id)
    return { blocked: false }
  }, [bumpStreakIfDone])

  const clearJustMastered = useCallback(() => setJustMastered(null), [])

  // ---- prefs ----
  const updatePrefs = useCallback((p) => setPrefs((prev) => ({ ...prev, ...p })), [])

  return {
    subjects,
    chapters: chaptersWithStatus,
    events,
    prefs,
    streak,
    overdue,
    dueToday,
    struggling,
    subjectMap,
    justMastered,
    clearJustMastered,
    refreshAll,
    createSubject,
    removeSubject,
    createChapter,
    updateChapter,
    removeChapter,
    reviseChapter,
    snoozeChapterAction,
    struggleChapterAction,
    masterEarlyAction,
    updatePrefs,
  }
}

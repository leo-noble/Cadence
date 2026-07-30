# Cadence — Study in rhythm

A calm, premium spaced-repetition study companion. Tells you exactly which
chapters to revise today, on a fixed schedule (intervals of 1, 3, 7, 14,
30, 90, and 180 days since the previous review) starting the moment you
first studied something. Built as a React PWA per the product blueprint.

## Stack

- **React 19 + Vite** — app shell, fast dev/build
- **Tailwind CSS** — iOS/SwiftUI-inspired design tokens (system grouped
  background colors, iOS corner radii, flat grouped-list shadows)
- **System font stack** (San Francisco on Apple devices, sensible
  fallbacks elsewhere) — no custom webfont to load, true to how SwiftUI
  apps typically look
- **lucide-react** — line icons
- **localStorage** — offline-first local persistence (no backend required to
  run this). Data model mirrors the blueprint's `Subject` / `Chapter` /
  `ReviewEvent` tables.
- **vite-plugin-pwa** — installable PWA, offline app-shell caching, manifest

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

The app starts empty — no demo data — so the first thing you'll want to
do is add a chapter from the Dashboard or Library.

## Routes

- `/` — marketing landing page (hero, schedule explainer, feature grid, install CTA)
- `/login` — local sign-in (name + optional email, no password, nothing server-side)
- `/app` — the actual Cadence app (Dashboard/Library/Calendar/Focus/Settings) —
  redirects to `/login` if no local profile exists yet

Installing the PWA opens straight into `/app` (see `start_url` in
`vite.config.js`); the landing page stays reachable via the logo link in
the app's sidebar.

## Deploying

This is a client-routed SPA, so whatever host you use needs to serve
`index.html` for unknown paths (like `/app`) instead of 404ing. Both are
already included:

- **Netlify** — `public/_redirects` (copied into `dist/` on build)
- **Vercel** — `vercel.json` at the project root

For any other static host, configure an equivalent "rewrite everything to
index.html" rule.

## Changelog — removed demo data and "no-server" marketing copy

- **No more auto-seeded demo chapters.** The app used to create a few
  sample chapters/subjects on first launch so the screens weren't empty;
  removed entirely (`seedDemoData` and its call site are gone) — new
  users now start with a genuinely empty Dashboard and Library.
- **Removed all "works offline / no password / no servers" messaging**
  from the visible UI: the landing page's "Works offline" and "A name,
  not an account" feature cards, the hero trust row underneath the CTA
  buttons, the login page's "no password to remember" subtitle and its
  bottom disclaimer paragraph, and the Settings profile section's "local
  profile, not an account" footnote. The underlying behavior (still
  local-only, still no password) hasn't changed — just the copy
  describing it.

## Changelog — corrected spaced-repetition schedule

The schedule didn't match the intended spaced-repetition rule. It's now
**7 reviews**, each spaced from the **previous review** (not from Day 0)
by 1, 3, 7, 14, 30, 90, and 180 days — replacing the old fixed 6-review,
1/3/7/15/30/60-cumulative-days-from-Day-0 schedule. For a chapter studied
Friday, Jul 24, 2026, that now produces:

| Review | Interval since previous | Date |
|---|---|---|
| Learn it | Day 0 | Fri, Jul 24, 2026 |
| Review 1 | +1 day | Sat, Jul 25, 2026 |
| Review 2 | +3 days | Tue, Jul 28, 2026 |
| Review 3 | +7 days | Tue, Aug 4, 2026 |
| Review 4 | +14 days | Tue, Aug 18, 2026 |
| Review 5 | +30 days | Thu, Sep 17, 2026 |
| Review 6 | +90 days | Wed, Dec 16, 2026 |
| Review 7 | +180 days | Mon, Jun 14, 2027 |

Verified against real date arithmetic — every row matches. (Review 7
comes out one day earlier than a hand-checked reference table; that's
consistent with the rule applied evenly across all 7 rows, so it's kept
as-is rather than special-cased.)

Updated every place that referenced the old numbers: the core engine
(`srs.js`), the landing page's schedule explainer and feature copy, and
the forgetting-curve infographic (now generated from the actual review
count instead of hand-drawn coordinates, so it can't drift out of sync
again). Also fixed the Calendar page, which was only plotting each
chapter's *next* pending review instead of its full remaining schedule —
review 3, 7, 15(now 14), 30, etc. never showed up until earlier ones were
completed. It now plots every future review at once, and the month grid
fills in the previous/next month's overflow days instead of leaving them
blank.

## Changelog — final production polish pass

**Critical fix: a real timezone bug in date math.** Several places converted
dates through `Date.prototype.toISOString()` (which reports the UTC date)
while other places worked in local time. For roughly half the world's
timezones, this could silently shift a review date by a day — e.g. a
chapter due "July 21" on the Dashboard could show its dot on July 20 in
the Calendar grid, or a chapter logged just after midnight could get
scheduled from the wrong "Day 0". Rewrote the core date helpers in
`srs.js` to work entirely in local calendar-day terms (no UTC round-trips)
and fixed every call site that had the same pattern (`storage.js`,
`FocusPage.jsx`, `AddChapterSheet.jsx`, `CalendarPage.jsx`). Verified with
a script simulating every real-world UTC offset from -11 to +14 — all
round-trip correctly now.

**Removed Export Data** as requested — and Import Data along with it,
since an import feature with nothing left to produce a compatible file is
just confusing dead UI. Removed the underlying `exportAllData`/
`importAllData` code and sanitizers too, not just the buttons.

**Fixed a landing-page accuracy bug this surfaced**: a feature card
claimed "Your data, exportable," which became false the moment Export was
removed. Replaced it with an honest description of the local sign-in
feature.

**Simplified a genuinely confusing chapter action.** "Skip to next" and
"Mark as revised" were two different buttons that did the *exact same
thing* internally — a real source of confusion. Removed the duplicate and
restructured the remaining actions into a clearer hierarchy: one primary
button (Mark as revised), a secondary pair (Snooze / Struggled), and a
lower-emphasis text action for the rare "I'm confident, end this cycle
early" case.

**Fixed misleading Calendar colors.** Day cells were tinted with the same
overdue/due/upcoming status colors used elsewhere in the app, but for an
unrelated meaning (how many reviews land on that day) — so a busy day
three weeks out could show up rust-red like something overdue. Switched
to a neutral brand-color intensity scale (light/moderate/heavy) with a
matching legend, and removed a redundant dot indicator that repeated the
same misleading color.

**Fixed a blank-page gap in Library** — filtering to a status with zero
matches (e.g. "Mastered" before you've mastered anything) showed nothing
at all with no explanation. Added a friendly, filter-specific empty state.

**Strengthened the landing page hero** so it explains the product within
seconds: a concrete kicker ("Spaced-repetition scheduling for students"),
a bold subheadline stating exactly what it does and when it reminds you,
and a compact "Works offline / No password / Free" trust row.

## Changelog — SwiftUI/iOS-style redesign

The whole app was re-skinned to read like a native iOS/SwiftUI app rather
than a generic web app:

- **System font everywhere** — no more custom webfonts (Fraunces/Inter
  removed); large titles are bold system type like iOS "Large Title"
  navigation bars.
- **Grouped inset lists** — chapters, subjects, and settings now live in
  rounded, flat, divided list containers (like `List` in SwiftUI /
  Settings.app) instead of individually shadowed floating cards. Shadows
  are reserved for things that actually float above content: sheets, the
  FAB, toasts.
- **iOS sheets** — Add Chapter and Chapter Detail are now real bottom
  sheets with a grabber handle, spring-in motion, and (for Add Chapter) a
  Cancel / Title / Add nav bar instead of a floating submit button.
- **Segmented controls** — the Library status filter and Settings theme
  picker use a sliding-pill segmented control instead of separate filter
  buttons.
- **iOS Settings.app layout** — profile banner, grouped sections with
  footnote text, a real 51×31 iOS-sized switch, and a centered red "Sign
  Out" row.
- **iOS Calendar-style month grid** — filled accent circle for today,
  tinted circle for the selected day, small dots instead of full-cell
  color washes.
- Color tokens switched to iOS system grouped-background values (light:
  `#F2F2F7`/`#FFFFFF`, dark: true black `#000000`/`#1C1C1E`), so dark mode
  matches iOS's OLED-friendly black rather than a dark gray.
- Removed leftover scaffold assets (`react.svg`, `vite.svg`, unused
  `hero.png`) and added a catch-all route so unknown URLs redirect home
  instead of rendering blank.

## Changelog — logo, login, infographic

- **New logo** — a rounded-badge mark with a pulse/rhythm line (reads as
  both a soundwave and a stylized "C"). Lives in `src/components/Logo.jsx`
  and as the favicon/PWA icon set in `public/icons/`.
- **Login (local-only, not real authentication).** There's still no
  backend, so this is a name-based local profile, not an account system —
  no password, nothing sent anywhere. `/app` now redirects to `/login` if
  no profile exists yet; signing in just personalizes the Dashboard
  greeting and adds a sign-out option in Settings and the sidebar. This
  is explained plainly on the login screen itself so it's never mistaken
  for real auth.
- **Forgetting-curve infographic** on the landing page — an animated SVG
  comparing unaided recall decay against Cadence's review points, right
  next to the schedule diagram it explains.

## Changelog — polish pass (glitches + clutter)

- **Fixed modal exit animations not playing.** `AnimatePresence` was
  nested *inside* `AddChapterSheet`/`ChapterDetailSheet`, but the parent
  (`AppShell`) removed those components from the tree with a plain `{cond
  && <Modal/>}`, unmounting them in the same commit before their internal
  `AnimatePresence` ever got a chance to animate an exit. Modals just
  vanished instead of animating closed. Fixed by moving `AnimatePresence`
  up to `AppShell`, where the conditional actually lives.
- **Removed a duplicate section.** "Needs extra attention" on the
  Dashboard showed the exact same cards already visible in Overdue/Due
  Today (a struggled chapter is still due/overdue, so it always appeared
  twice). The inline "Needs attention" flag on each card already covers
  this — the sitewide list is gone.
- **Removed redundant subtext** on chapter cards — e.g. a "Due today"
  chip no longer sits next to a second "Due today" label underneath it;
  the extra line only shows when it adds real information (days overdue,
  days until unlock).
- **Removed a stray marketing line** ("No account needed. Works offline.
  Free.") from the hero, and the "How it works" landing section, which
  said the same thing as the schedule diagram directly beneath it.
- **Wired up the Focus timer's chapter picker** — selecting a chapter
  used to do nothing visible; it now shows under "Deep work block" while
  you're studying it.
- Snoozing at the 2-snooze cap now gives the same inline feedback in the
  Library that it already gave on the Dashboard, instead of silently
  doing nothing there.

## Changelog — premium redesign + review-locking fix

**Fixed a real scheduling bug:** chapters that weren't due yet could still
be marked "revised" from the Library (any status filter showed live
action buttons), which let you complete a future review — e.g. finishing
the day-7 review while day-3 hadn't happened — collapsing the whole
schedule forward. Now:
- A review can only be completed, snoozed, flagged, or skipped once it's
  actually **due or overdue**. This is enforced in two places — the UI
  hides the controls for upcoming chapters (showing a lock icon instead),
  and `useCadence.js` refuses the action even if called directly — so
  there's no path that lets a chapter jump ahead of its own timeline.
- The chapter detail view shows a clear "unlocks in N days, on \<date\>"
  panel for anything not yet due, instead of action buttons.
- Hardened `importAllData`: an imported backup file is now rebuilt
  field-by-field with type/length checks and cross-reference validation
  (chapters must point at a real subject, events at a real chapter),
  rather than trusted and spread directly into app state.

**Visual pass:** added `framer-motion` throughout — card enter/exit and
reordering, modal spring transitions, a shared sliding active-tab
indicator in the nav, staggered hero/feature reveals on the landing page,
button press feedback. Refined shadows (`shadow-elevated`), pill-style
status chips, tighter display-type tracking, and a subtle gradient-glow
hero background on the landing page.

## What's implemented

- **Landing page** — hero with a live dashboard mockup, a forgetting-curve
  infographic, the 7-review schedule laid out visually, a feature grid,
  and an "Install app" button that uses the native `beforeinstallprompt`
  event when the browser supports it
- **Local sign-in** — a name-based local profile (not real authentication
  — no password, no server) that personalizes the Dashboard greeting
- **Dashboard ("Today")** — overdue + due-today chapters, one-tap "mark
  revised," snooze (capped at 2 in a row), streak badge, weekly insight card
- **Add chapter** — quick capture (title + subject in one flow) with
  optional notes/studied-date expansion
- **Chapter detail** — full 7-review timeline (past + upcoming), mark
  revised / snooze / flag as struggled / end the cycle early / delete —
  all locked until the review is actually due
- **Subject Library** — chapters grouped by subject, filterable by status,
  with a proper empty state for every filter
- **Calendar** — month view of review load per day (light/moderate/heavy),
  tap a day to see what's due
- **Focus (Pomodoro)** — 25/5 timer, optionally linked to a chapter, tracks
  sessions completed today
- **Settings** — light/dark/auto theme, notification permission toggle,
  sign out
- **Offline-first** — service worker caches the app shell; all reads/writes
  are local, so logging works with no connection
- **PWA** — installable on desktop and mobile (manifest + icons included)

## What's intentionally not built yet

The blueprint calls for a **Supabase backend** (accounts, multi-device sync,
and a scheduled Edge Function that sends real push notifications at
midnight). That needs a live Supabase project and real credentials, so it's
out of scope for a local handoff — this build is fully functional standalone
using localStorage instead.

If you want that next layer:
1. Create a Supabase project, apply the schema from the blueprint (§4.3).
2. Swap the functions in `src/lib/storage.js` for Supabase client calls
   (same function signatures, so the rest of the app doesn't need to
   change).
3. Add a daily cron Edge Function that queries `ReviewEvent`s due "today"
   and sends a Web Push notification — this is the only reliable way to
   notify a student even when the app isn't open (see blueprint §6.3).
4. On iOS, reminders only fire for PWAs added to the Home Screen (iOS
   16.4+) — the in-app notice in Settings already flags this.

Until then, the in-browser `Notification` permission toggle in Settings
will fire local reminders only while the app is open in a tab — it's a nice
complement but not a substitute for the server-side push described above.

## Project structure

```
src/
  lib/
    srs.js          # spaced-repetition scheduling engine (pure functions)
    storage.js       # localStorage data layer (subjects/chapters/events/profile)
    useCadence.js    # central React hook: state + actions
  components/
    Nav.jsx
    Logo.jsx
    ChapterCard.jsx
    ChapterDetailSheet.jsx
    AddChapterSheet.jsx
    StatusChip.jsx
    SegmentedControl.jsx
    Grabber.jsx          # bottom-sheet grab handle
    StreakBadge.jsx
    InsightCard.jsx
    DashboardMockup.jsx  # landing-page hero illustration
    ForgettingCurve.jsx  # landing-page infographic
  pages/
    LandingPage.jsx  # marketing homepage at "/"
    LoginPage.jsx    # local sign-in at "/login"
    Dashboard.jsx
    LibraryPage.jsx
    CalendarPage.jsx
    FocusPage.jsx
    SettingsPage.jsx
  App.jsx            # router: "/" -> Landing, "/login" -> Login, "/app" -> AppShell
  AppShell.jsx        # the app itself (nav + pages + modals)
  main.jsx
  index.css          # Tailwind + design tokens
public/
  icons/             # PWA icons (192, 512, favicon)
```

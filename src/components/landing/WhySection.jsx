import { Reveal, Stagger } from './Reveal'

// The counter-argument section: what most students do instead, and why the
// schedule beats it. Two columns of plain prose separated by space and a
// change of weight — no cards, no icons, because this part is an argument and
// decoration would undercut it.
const HABITS = [
  {
    label: 'Re-reading the chapter',
    body: 'Feels productive because it feels familiar. Familiarity is not recall — you recognise the page without being able to reproduce it in an exam.',
  },
  {
    label: 'Cramming the week before',
    body: 'Works for Friday and is gone by the following month. Everything you learned in August has to be learned again in December.',
  },
  {
    label: 'Highlighting and re-writing notes',
    body: 'Hours of work that produce a tidier copy of something you already have. The tidying is not the studying.',
  },
]

export default function WhySection() {
  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-12 md:gap-20 items-start">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-wideish text-brand mb-4">
          Why it works
        </p>
        <h2 className="font-display text-[32px] md:text-[42px] font-semibold leading-[1.1] tracking-tightest mb-6">
          Revision fails for boring reasons.
        </h2>
        <p className="text-[16.5px] text-ink-soft leading-relaxed max-w-md">
          Not because students are lazy — because the three habits everyone
          falls back on all feel like work while doing very little for memory.
          Spacing the same material over weeks does more, and takes less time.
        </p>
      </Reveal>

      <Stagger className="space-y-8 md:space-y-10 md:pt-2" stagger={0.09}>
        {HABITS.map((h) => (
          <Stagger.Item key={h.label}>
            <div className="flex gap-5">
              <span
                aria-hidden="true"
                className="mt-2.5 h-1.5 w-1.5 rounded-full bg-ink-soft/40 shrink-0"
              />
              <div>
                <h3 className="text-[16px] font-medium mb-1.5">{h.label}</h3>
                <p className="text-[14.5px] text-ink-soft leading-relaxed">{h.body}</p>
              </div>
            </div>
          </Stagger.Item>
        ))}
        <Stagger.Item>
          <div className="flex gap-5">
            <span
              aria-hidden="true"
              className="mt-2.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0"
            />
            <div>
              <h3 className="text-[16px] font-medium mb-1.5 text-brand">Four spaced reviews</h3>
              <p className="text-[14.5px] text-ink-soft leading-relaxed">
                Roughly forty minutes per chapter, spread over six weeks, and
                the chapter is still there at the end of the year. The only
                hard part is remembering to do it on the right day — which is
                the part Cadence handles.
              </p>
            </div>
          </div>
        </Stagger.Item>
      </Stagger>
    </div>
  )
}

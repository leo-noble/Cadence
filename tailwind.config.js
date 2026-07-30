/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Every color here is a CSS variable defined per theme+mode pair in
        // index.css (see [data-theme="..."][data-mode="..."] blocks) — one
        // class works unchanged across every combination, since the
        // variable itself is what changes.
        paper: 'var(--color-paper)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        brand: 'var(--color-brand)',
        'brand-soft': 'var(--color-brand-soft)',
        accent: 'var(--color-accent)',
        divider: 'var(--color-divider)',
        // Per-theme hover/selection tints — e.g. hover:bg-hover, bg-selected —
        // so interactive states pick up each theme's accent hue rather than a
        // flat gray overlay that would look identical everywhere.
        hover: 'var(--color-hover)',
        selected: 'var(--color-selected)',

        // Status colors stay constant across themes — they're semantic
        // (overdue/due/upcoming/mastered), not part of the aesthetic skin,
        // and were tuned to read clearly on both light and dark surfaces.
        status: {
          overdue: '#A5342A',
          due: '#8F3D49',
          upcoming: '#A8A3A6',
          mastered: '#4A4448',
        },
      },
      fontFamily: {
        // A characterful serif for headlines paired with a clean grotesk
        // for everything functional — set up once in index.html.
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        control: '10px',
        capsule: '9999px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.08)',
        elevated: 'var(--shadow-elevated)',
        sheet: 'var(--shadow-sheet)',
        fab: 'var(--shadow-fab)',
      },
      backgroundImage: {
        panel: 'var(--gradient-panel)',
      },
      letterSpacing: {
        tightest: '-0.03em',
        wideish: '0.06em',
      },
      spacing: {
        18: '4.5rem',
      },
      transitionDuration: {
        180: '180ms',
      },
    },
  },
  plugins: [],
}

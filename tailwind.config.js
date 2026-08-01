/** @type {import('tailwindcss').Config} */

// Every theme color is a CSS variable defined per theme+mode pair in index.css
// (see [data-theme="..."][data-mode="..."] blocks) — one class works unchanged
// across every combination, since the variable itself is what changes.
//
// The color-mix wrapper is what makes opacity modifiers work. Tailwind can only
// inject an alpha into a color it can parse, and it cannot see through a bare
// var() to the hex behind it — so with a plain `var(--color-x)` value it emits
// `bg-surface-2` but silently drops `bg-surface-2/30` from the stylesheet
// entirely, leaving the element transparent with no error anywhere. Tailwind
// substitutes <alpha-value> with the modifier (or 1 when there is none), and
// color-mix against `transparent` scales the color's alpha by that much:
// `bg-surface-2` stays exactly the variable's color, `bg-surface-2/30` is it at
// 30%. Going through color-mix rather than the more usual channel-triple
// variables keeps the variables themselves as ordinary colors, so hover/
// selected can carry their own baked-in alpha and anything reading
// var(--color-x) directly from CSS still works.
const themeColor = (name) =>
  `color-mix(in srgb, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: themeColor('paper'),
        surface: themeColor('surface'),
        'surface-2': themeColor('surface-2'),
        ink: themeColor('ink'),
        'ink-soft': themeColor('ink-soft'),
        brand: themeColor('brand'),
        'brand-soft': themeColor('brand-soft'),
        accent: themeColor('accent'),
        divider: themeColor('divider'),
        // Per-theme hover/selection tints — e.g. hover:bg-hover, bg-selected —
        // so interactive states pick up each theme's accent hue rather than a
        // flat gray overlay that would look identical everywhere.
        hover: themeColor('hover'),
        selected: themeColor('selected'),

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
        // The dense end of the scale: calendar blocks, all-day capsules and
        // the checkboxes inside them, which a 10px control radius rounds
        // into a pill at 16–20px tall.
        chip: '6px',
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

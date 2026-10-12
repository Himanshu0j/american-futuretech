/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  /* ── Colours the CMS can set at runtime ─────────────────────────────
     Capstone cards, career-role pills and every other list the client
     recolours from the admin panel store a Tailwind gradient as a plain
     string in MongoDB (default "from-brand-600 to-ink-900"). Tailwind scans
     source files only, so a class that exists in the database but nowhere in
     the code was never emitted — the badge then painted NO background while
     its text stayed white, which made "ENTRY LEVEL" invisible on the four
     course pages that used the old indigo default. Safelisting the gradient
     stops keeps every colour the admin can pick in the build. Values that
     still fall outside this list are covered by a solid brand-blue base on
     the element itself (see the capstone card in CourseDetailPage).
  ----------------------------------------------------------------*/
  safelist: [
    // The .jsx picker only offers 400/500/600 shades, so that is all the
    // safelist needs to emit (~5 KB gzipped) — the darker/lighter shades the
    // code itself uses are compiled from source as usual.
    {
      pattern: /^(from|via|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(400|500|600)$/,
    },
    {
      pattern: /^(from|via|to)-(brand|ink|gold|sand)-(100|200|300|400|500|600|700|800|900|950)$/,
    },
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Brand ramp: the client's own logo colours ───────────
           ink   = deep brand blue (dark surfaces, headings, buttons)
           brand = bright brand blue (primary accent, links, hovers)
           gold  = BRAND RED (was champagne gold — the accent colour;
                   the key name is kept so existing markup keeps working)
           sand  = red tints (was sand/cream surfaces)

           Brand blue #002060 and brand red #F00000 were sampled from
           client/public/images/logo-horizontal.png. The site is blue + red
           on white; retuning the palette starts here.

           ── Admin → Settings → Appearance ────────────────────────
           Every brand ramp below resolves through a "R G B" channel
           variable declared in client/src/index.css (`--tw-*`). The
           defaults there equal the hexes shown in these comments, so an
           unthemed build is pixel-identical to the old hardcoded one —
           but the CMS can now rewrite a channel (see
           client/src/lib/siteTheme.js) and the WHOLE site follows: all
           `bg-blue-600`, `text-slate-600`, `border-gold-500`… utilities,
           including `/opacity` variants, keep working because Tailwind
           substitutes the channel into `rgb(... / <alpha-value>)`.
        ---------------------------------------------------------*/
        ink: {
          950: 'rgb(var(--tw-ink-950) / <alpha-value>)',   // #001845
          900: 'rgb(var(--tw-ink-900) / <alpha-value>)',   // #002060
          800: 'rgb(var(--tw-ink-800) / <alpha-value>)',   // #001C57
          700: 'rgb(var(--tw-ink-700) / <alpha-value>)',   // #0A2A63
          600: 'rgb(var(--tw-ink-600) / <alpha-value>)',   // #0B3A80
        },
        brand: {
          50: 'rgb(var(--tw-brand-50) / <alpha-value>)',    // #EFF6FF
          100: 'rgb(var(--tw-brand-100) / <alpha-value>)',  // #DBEAFE
          400: 'rgb(var(--tw-brand-400) / <alpha-value>)',  // #60A5FA
          500: 'rgb(var(--tw-brand-500) / <alpha-value>)',  // #3B82F6
          600: 'rgb(var(--tw-brand-600) / <alpha-value>)',  // #2563EB
          700: 'rgb(var(--tw-brand-700) / <alpha-value>)',  // #1D4ED8
          800: 'rgb(var(--tw-brand-800) / <alpha-value>)',  // #1E40AF
        },
        gold: {
          100: 'rgb(var(--tw-gold-100) / <alpha-value>)',   // #FDECEC
          200: 'rgb(var(--tw-gold-200) / <alpha-value>)',   // #F9C9C9
          300: 'rgb(var(--tw-gold-300) / <alpha-value>)',   // #F5AFAF
          400: 'rgb(var(--tw-gold-400) / <alpha-value>)',   // #FF6B6B
          500: 'rgb(var(--tw-gold-500) / <alpha-value>)',   // #F00000
          600: 'rgb(var(--tw-gold-600) / <alpha-value>)',   // #C81E1E
        },
        sand: {
          100: 'rgb(var(--tw-sand-100) / <alpha-value>)',   // #FAF0F0
          200: 'rgb(var(--tw-sand-200) / <alpha-value>)',   // #FCE7E7
          300: 'rgb(var(--tw-sand-300) / <alpha-value>)',   // #F5C9C9
        },
        /* The neutral ramp drives most body text, borders and card surfaces on
           the public site, so the Appearance tab's "Text colour" retints it
           (50 stays near-white, 950 near-black — only the hue shifts). */
        slate: {
          50: 'rgb(var(--tw-slate-50) / <alpha-value>)',    // #F8FAFC
          100: 'rgb(var(--tw-slate-100) / <alpha-value>)',  // #F1F5F9
          200: 'rgb(var(--tw-slate-200) / <alpha-value>)',  // #E2E8F0
          300: 'rgb(var(--tw-slate-300) / <alpha-value>)',  // #CBD5E1
          400: 'rgb(var(--tw-slate-400) / <alpha-value>)',  // #94A3B8
          500: 'rgb(var(--tw-slate-500) / <alpha-value>)',  // #64748B
          600: 'rgb(var(--tw-slate-600) / <alpha-value>)',  // #475569
          700: 'rgb(var(--tw-slate-700) / <alpha-value>)',  // #334155
          800: 'rgb(var(--tw-slate-800) / <alpha-value>)',  // #1E293B
          900: 'rgb(var(--tw-slate-900) / <alpha-value>)',  // #0F172A
          950: 'rgb(var(--tw-slate-950) / <alpha-value>)',  // #020617
        },
        blue: {
          50: 'rgb(var(--tw-blue-50) / <alpha-value>)',
          100: 'rgb(var(--tw-blue-100) / <alpha-value>)',
          200: 'rgb(var(--tw-blue-200) / <alpha-value>)',
          300: 'rgb(var(--tw-blue-300) / <alpha-value>)',
          400: 'rgb(var(--tw-blue-400) / <alpha-value>)',
          500: 'rgb(var(--tw-blue-500) / <alpha-value>)',
          600: 'rgb(var(--tw-blue-600) / <alpha-value>)',
          700: 'rgb(var(--tw-blue-700) / <alpha-value>)',
          800: 'rgb(var(--tw-blue-800) / <alpha-value>)',
          900: 'rgb(var(--tw-blue-900) / <alpha-value>)',
          950: 'rgb(var(--tw-blue-950) / <alpha-value>)',
        },
        canvas: '#F7F7F5',
        hairline: {
          DEFAULT: '#E6E8EC',
          strong: '#D5D9E0',
        },
        elms: {
          beige: '#F7F7F5',
          bg: '#F7F7F5',
          'green-900': 'rgb(var(--tw-ink-900) / <alpha-value>)',
          'green-700': 'rgb(var(--tw-ink-700) / <alpha-value>)',
          'green-500': 'rgb(var(--tw-blue-700) / <alpha-value>)',
          'green-300': 'rgb(var(--tw-gold-500) / <alpha-value>)',
          'green-100': 'rgb(var(--tw-sand-200) / <alpha-value>)',
          'purple-900': 'rgb(var(--tw-ink-800) / <alpha-value>)',
          'purple-500': 'rgb(var(--tw-blue-600) / <alpha-value>)',
          'purple-100': 'rgb(var(--tw-blue-100) / <alpha-value>)',
          card: '#ffffff',
          border: '#E6E8EC',
          'border-dark': 'rgb(var(--tw-ink-900) / 0.12)',
          text: 'rgb(var(--tw-ink-900) / <alpha-value>)',
          muted: 'rgb(var(--tw-text-body) / <alpha-value>)',
          faint: 'rgb(var(--tw-text-faint) / <alpha-value>)',
        },
        aft: {
          canvas: '#F7F7F5',
          subtle: '#F8FAFC',
          card: '#ffffff',
          elevated: '#F1F5F9',
          border: '#E6E8EC',
          'border-strong': '#D5D9E0',
          blue: 'rgb(var(--tw-ink-900) / <alpha-value>)',
          blueHover: 'rgb(var(--tw-ink-700) / <alpha-value>)',
          sky: 'rgb(var(--tw-blue-700) / <alpha-value>)',
          emerald: 'rgb(var(--tw-blue-600) / <alpha-value>)',
          amber: 'rgb(var(--tw-gold-600) / <alpha-value>)',
          text: 'rgb(var(--tw-ink-900) / <alpha-value>)',
          muted: 'rgb(var(--tw-text-body) / <alpha-value>)',
          faint: 'rgb(var(--tw-text-faint) / <alpha-value>)',
        },
        apple: {
          bg: '#F7F7F5',
          subtle: '#F8FAFC',
          card: '#ffffff',
          secondary: '#F1F5F9',
          tertiary: '#E6E8EC',
          blue: 'rgb(var(--tw-ink-900) / <alpha-value>)',
          blueHover: 'rgb(var(--tw-ink-700) / <alpha-value>)',
          text: 'rgb(var(--tw-ink-900) / <alpha-value>)',
          muted: 'rgb(var(--tw-text-body) / <alpha-value>)',
          faint: 'rgb(var(--tw-text-faint) / <alpha-value>)',
        },
        cyber: {
          cyan: '#7DD3FC',
          sky: 'rgb(var(--tw-blue-400) / <alpha-value>)',
          rose: '#FF5A5A',
          red: 'rgb(var(--tw-gold-500) / <alpha-value>)',
          emerald: 'rgb(var(--tw-blue-400) / <alpha-value>)',
          purple: '#93C5FD',
          indigo: 'rgb(var(--tw-ink-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        /* Both stacks resolve through variables declared in index.css, so the
           Appearance tab swaps the site's fonts at runtime. The quoted
           defaults keep the compiled CSS correct even before any JS runs. */
        heading: ['var(--font-heading)', '"Plus Jakarta Sans"', '"Rubik"', 'Inter', '-apple-system', 'sans-serif'],
        sans: ['var(--font-body)', '"Inter"', '"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'card-sm': '12px',
        'card': '16px',
        'card-lg': '18px',
        'card-xl': '24px',
        'squircle-sm': '12px',
        'squircle-md': '16px',
        'squircle-lg': '20px',
        'squircle-xl': '26px',
      },
      boxShadow: {
        /* Layered, low-opacity shadows read as premium depth */
        'subtle': '0 1px 2px rgba(11, 18, 32, 0.05)',
        'surface': '0 1px 2px rgba(11, 18, 32, 0.05), 0 4px 12px -4px rgba(11, 18, 32, 0.08)',
        'elevated': '0 1px 2px rgba(11, 18, 32, 0.05), 0 12px 28px -10px rgba(11, 18, 32, 0.14)',
        'premium': '0 2px 4px rgba(11, 18, 32, 0.04), 0 24px 48px -18px rgba(11, 18, 32, 0.22)',
        'specular': 'inset 0 1px 0 rgba(255, 255, 255, 0.22)',
        'gold': '0 10px 30px -12px rgb(var(--tw-gold-500) / 0.45)',
        'brand': '0 10px 30px -12px rgb(var(--tw-blue-700) / 0.55)',
        'apple-specular': 'inset 0 1px 0 rgba(255, 255, 255, 0.22)',
        'apple-card': '0 1px 2px rgba(11, 18, 32, 0.05), 0 12px 28px -10px rgba(11, 18, 32, 0.14)',
        'apple-hover': '0 2px 4px rgba(11, 18, 32, 0.04), 0 24px 48px -18px rgba(11, 18, 32, 0.22)',
      },
      backgroundImage: {
        'aurora-light': 'radial-gradient(900px 420px at 12% -10%, rgb(var(--tw-blue-700) / 0.10), transparent 60%), radial-gradient(760px 420px at 88% 0%, rgb(var(--tw-gold-500) / 0.10), transparent 62%), linear-gradient(180deg, #FFFFFF 0%, #F7F7F5 100%)',
        'aurora-ink': 'radial-gradient(820px 420px at 8% -15%, rgb(var(--tw-blue-700) / 0.30), transparent 62%), radial-gradient(720px 460px at 92% 10%, rgb(var(--tw-gold-500) / 0.16), transparent 60%), linear-gradient(165deg, rgb(var(--tw-ink-950)) 0%, rgb(var(--tw-ink-900)) 55%, rgb(var(--tw-ink-800)) 100%)',
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--tw-blue-600)) 0%, rgb(var(--tw-blue-700)) 55%, rgb(var(--tw-ink-700)) 100%)',
        'gold-gradient': 'linear-gradient(135deg, rgb(var(--tw-gold-400)) 0%, rgb(var(--tw-gold-500)) 55%, rgb(var(--tw-gold-600)) 100%)',
        'ink-gradient': 'linear-gradient(165deg, rgb(var(--tw-ink-950)) 0%, rgb(var(--tw-ink-800)) 100%)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'apple-spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        'rise-in': 'riseIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'sheen': 'sheen 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

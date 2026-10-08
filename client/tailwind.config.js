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
        ---------------------------------------------------------*/
        ink: {
          950: '#001845',
          900: '#002060',
          800: '#001C57',
          700: '#0A2A63',
          600: '#0B3A80',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        gold: {
          100: '#FDECEC',
          200: '#F9C9C9',
          300: '#F5AFAF',
          400: '#FF6B6B',
          500: '#F00000',
          600: '#C81E1E',
        },
        sand: {
          100: '#FAF0F0',
          200: '#FCE7E7',
          300: '#F5C9C9',
        },
        canvas: '#F7F7F5',
        hairline: {
          DEFAULT: '#E6E8EC',
          strong: '#D5D9E0',
        },
        elms: {
          beige: '#F7F7F5',
          bg: '#F7F7F5',
          'green-900': '#002060',
          'green-700': '#0A2A63',
          'green-500': '#1D4ED8',
          'green-300': '#F00000',
          'green-100': '#FCE7E7',
          'purple-900': '#001C57',
          'purple-500': '#2563EB',
          'purple-100': '#DBEAFE',
          card: '#ffffff',
          border: '#E6E8EC',
          'border-dark': 'rgba(0, 32, 96, 0.12)',
          text: '#002060',
          muted: '#44506B',
          faint: '#9AA3B2',
        },
        aft: {
          canvas: '#F7F7F5',
          subtle: '#F8FAFC',
          card: '#ffffff',
          elevated: '#F1F5F9',
          border: '#E6E8EC',
          'border-strong': '#D5D9E0',
          blue: '#002060',
          blueHover: '#0A2A63',
          sky: '#1D4ED8',
          emerald: '#2563EB',
          amber: '#C81E1E',
          text: '#002060',
          muted: '#44506B',
          faint: '#9AA3B2',
        },
        apple: {
          bg: '#F7F7F5',
          subtle: '#F8FAFC',
          card: '#ffffff',
          secondary: '#F1F5F9',
          tertiary: '#E6E8EC',
          blue: '#002060',
          blueHover: '#0A2A63',
          text: '#002060',
          muted: '#44506B',
          faint: '#9AA3B2',
        },
        cyber: {
          cyan: '#7DD3FC',
          sky: '#60A5FA',
          rose: '#FF5A5A',
          red: '#F00000',
          emerald: '#60A5FA',
          purple: '#93C5FD',
          indigo: '#002060',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', '"Rubik"', 'Inter', '-apple-system', 'sans-serif'],
        sans: ['"Inter"', '"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
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
        'gold': '0 10px 30px -12px rgba(240, 0, 0, 0.45)',
        'brand': '0 10px 30px -12px rgba(29, 78, 216, 0.55)',
        'apple-specular': 'inset 0 1px 0 rgba(255, 255, 255, 0.22)',
        'apple-card': '0 1px 2px rgba(11, 18, 32, 0.05), 0 12px 28px -10px rgba(11, 18, 32, 0.14)',
        'apple-hover': '0 2px 4px rgba(11, 18, 32, 0.04), 0 24px 48px -18px rgba(11, 18, 32, 0.22)',
      },
      backgroundImage: {
        'aurora-light': 'radial-gradient(900px 420px at 12% -10%, rgba(29,78,216,0.10), transparent 60%), radial-gradient(760px 420px at 88% 0%, rgba(240,0,0,0.10), transparent 62%), linear-gradient(180deg, #FFFFFF 0%, #F7F7F5 100%)',
        'aurora-ink': 'radial-gradient(820px 420px at 8% -15%, rgba(29,78,216,0.30), transparent 62%), radial-gradient(720px 460px at 92% 10%, rgba(240,0,0,0.16), transparent 60%), linear-gradient(165deg, #001845 0%, #002060 55%, #001C57 100%)',
        'brand-gradient': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #0A2A63 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FF6B6B 0%, #F00000 55%, #C81E1E 100%)',
        'ink-gradient': 'linear-gradient(165deg, #001845 0%, #001C57 100%)',
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

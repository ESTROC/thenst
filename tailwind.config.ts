import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        card: '0 1px 3px rgba(10,37,64,.06), 0 8px 24px rgba(10,37,64,.06)',
        hover: '0 8px 16px rgba(10,37,64,.08), 0 20px 48px rgba(10,37,64,.12)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        'nst-orange': {
          DEFAULT: '#d95325',
          hover: '#bc3f18',
        },
        'nst-ink': {
          DEFAULT: '#171b22',
          dark: '#111419',
          card: '#181c23',
          border: '#3b414a',
        },
        'nst-paper': {
          DEFAULT: '#f7f6f2',
          card: '#eceae3',
          hover: '#efede6',
          border: '#e5e3db',
        },
        'nst-muted': {
          DEFAULT: '#737a83',
          light: '#9ba1a9',
          dark: '#4f555d',
        },
        // NST Learn palette
        navy: {
          50: '#EAF0F7', 100: '#D5E1EF', 200: '#A7BFD9',
          300: '#6E8FBB', 400: '#3C5E91', 500: '#0A2540',
          600: '#081E34', 700: '#061728', 800: '#04101C', 900: '#020910',
        },
        sky: { DEFAULT: '#2E90FA', soft: '#E3F0FF' },
        amber: { DEFAULT: '#F5A623', soft: '#FFF3DD' },
        emerald: { DEFAULT: '#10B981', soft: '#DEF7EC' },
        violet: { DEFAULT: '#7C5CFC', soft: '#EEEAFE' },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        saffron: {
          DEFAULT: '#FF9933',
          foreground: '#FFFFFF',
        },
        'india-green': {
          DEFAULT: '#138808',
          foreground: '#FFFFFF',
        },
        'ashoka-blue': {
          DEFAULT: '#000080',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'fade-up': 'fade-up .5s ease forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}
export default config

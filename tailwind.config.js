/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Child-friendly colors
        child: {
          primary: 'hsl(var(--child-primary))',
          secondary: 'hsl(var(--child-secondary))',
        },
        learning: {
          primary: 'hsl(var(--learning-primary))',
          secondary: 'hsl(var(--learning-secondary))',
        },
        story: {
          primary: 'hsl(var(--story-primary))',
          magic: 'hsl(var(--story-magic))',
        },
        // Yoluno brand colors
        cyan: {
          DEFAULT: '#00d8d8',
          50: '#e6ffff',
          100: '#ccfffe',
          200: '#99fffd',
          300: '#66fffc',
          400: '#33f5f5',
          500: '#00d8d8',
          600: '#00b3b3',
          700: '#008f8f',
          800: '#006b6b',
          900: '#004747',
        },
        charcoal: {
          DEFAULT: '#2e2e2e',
          light: '#4d4d4d',
          muted: '#6d6d6d',
        },
        pastel: {
          pink: '#ffeef5',
          blue: '#eef7ff',
          'blue-dark': '#c9e5ff',
          purple: '#f7d9f5',
          'purple-dark': '#eadcfb',
          yellow: '#ffe888',
          'yellow-dark': '#fcd635',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
        logo: ['Boldonse', 'Nunito', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

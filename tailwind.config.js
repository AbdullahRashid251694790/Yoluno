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
        yoluno: {
          teal: '#2BD4D0',
          'teal-dark': '#24B8B4',
          navy: '#2a3853',
          cream: '#FEF6E4',
          'light-blue': '#EDF7FF',
        },
        cyan: {
          DEFAULT: '#2BD4D0',
          50: '#e6ffff',
          100: '#ccfffe',
          200: '#99fffd',
          300: '#66fffc',
          400: '#33f5f5',
          500: '#2BD4D0',
          600: '#24B8B4',
          700: '#1d9894',
          800: '#167875',
          900: '#0f5856',
        },
        charcoal: {
          DEFAULT: '#2a3853',
          light: '#4d4d4d',
          muted: '#6d6d6d',
        },
        pastel: {
          pink: '#ffeef5',
          blue: '#EDF7FF',
          'blue-dark': '#c9e5ff',
          purple: '#f7d9f5',
          'purple-dark': '#eadcfb',
          yellow: '#ffe888',
          'yellow-dark': '#fcd635',
          cream: '#FEF6E4',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Bricolage Grotesque', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
        playful: ['Fredoka', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        heading: ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

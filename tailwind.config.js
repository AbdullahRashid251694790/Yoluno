/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1200px',
      },
    },
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
        // Landing site character colors
        luno: 'hsl(var(--luno))',
        lolo: 'hsl(var(--lolo))',
        lumi: 'hsl(var(--lumi))',
        lala: 'hsl(var(--lala))',
        gold: 'hsl(var(--gold))',
        parchment: 'hsl(var(--parchment))',
        linen: 'hsl(var(--linen))',
        cloud: 'hsl(var(--cloud))',
        stone: 'hsl(var(--stone))',
        navy: 'hsl(var(--navy))',
        'text-body': 'hsl(var(--text-body))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1.5rem',
        '2xl': '20px',
        '3xl': '24px',
        pill: '40px',
      },
      boxShadow: {
        warm: '0 8px 32px rgba(45, 42, 38, 0.06)',
        'warm-lg': '0 16px 48px rgba(45, 42, 38, 0.1)',
        'warm-sm': '0 4px 16px rgba(45, 42, 38, 0.04)',
      },
      fontSize: {
        /* Typography tokens — exact values from landing page */
        'display': ['56px', { lineHeight: '1.25' }],   /* HeroSection h1: text-[56px] leading-tight */
        'h1':      ['48px', { lineHeight: '1.2' }],     /* FeaturesPage h1: text-5xl */
        'h2':      ['38px', { lineHeight: '1.3' }],     /* Section h2: text-[38px] */
        'h3':      ['30px', { lineHeight: '1.3' }],     /* Section h2 small: text-3xl */
        'h4':      ['24px', { lineHeight: '1.3' }],     /* Card h3: text-2xl */
        'body-lg': ['18px', { lineHeight: '1.625' }],   /* Section descriptions: text-lg leading-relaxed */
        'body':    ['15px', { lineHeight: '1.7' }],      /* SpacesSection body: text-[15px] leading-[1.7] */
        'body-sm': ['14px', { lineHeight: '1.625' }],   /* Captions, small text: text-sm leading-relaxed */
        'caption': ['12px', { lineHeight: '1.5' }],      /* Labels, tiny text: text-xs */
      },
      fontFamily: {
        /* From landing tailwind.config.ts lines 17-18 */
        heading: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        body: ['Nunito', 'Segoe UI', 'sans-serif'],
        sans: ['Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        /* Kept for kids pages */
        playful: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        /* Legacy alias — landing components use font-heading-landing */
        'heading-landing': ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
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
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'block-float': {
          '0%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.6' },
          '25%': { transform: 'translateY(-18px) translateX(8px) rotate(4deg)', opacity: '0.9' },
          '50%': { transform: 'translateY(-30px) translateX(-6px) rotate(-3deg)', opacity: '0.7' },
          '75%': { transform: 'translateY(-12px) translateX(10px) rotate(5deg)', opacity: '0.85' },
          '100%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.6' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'block-float': 'block-float ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};

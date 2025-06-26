import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        'sans': ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        'primary-dark': '#0A1933',
        'primary-blue': {
          DEFAULT: '#004AB7',
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B3FF',
          400: '#3399FF',
          500: '#004AB7',
          600: '#003D99',
          700: '#003080',
          800: '#002366',
          900: '#00164D',
        },
        'secondary-blue': {
          DEFAULT: '#0057D9',
          50: '#E6F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B7FF',
          400: '#339FFF',
          500: '#0057D9',
          600: '#0049B8',
          700: '#003B96',
          800: '#002D75',
          900: '#001F54',
        },
        'light-bg': {
          DEFAULT: '#F0F4FC',
          50: '#FAFBFE',
          100: '#F5F8FD',
          200: '#F0F4FC',
          300: '#EBF0FB',
          400: '#E6ECFA',
          500: '#E1E8F9',
          600: '#DDE4F8',
          700: '#D8E0F7',
          800: '#D3DCF6',
          900: '#CED8F5',
        },
      },
      boxShadow: {
        'blue': '0 4px 14px 0 rgba(0, 74, 183, 0.10)',
        'blue-lg': '0 10px 25px -3px rgba(0, 74, 183, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-blue': 'pulseBlue 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseBlue: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)',
          },
          '70%': {
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)',
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
      },
      colors: {
        'primary-dark': '#1E40AF',
        'primary-blue': {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        'secondary-blue': {
          DEFAULT: '#60A5FA',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#60A5FA',
          600: '#3B82F6',
          700: '#2563EB',
          800: '#1D4ED8',
          900: '#1E40AF',
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
    },
  },
  plugins: [],
};
export default config;
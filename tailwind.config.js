/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  safelist: [
    'bg-slate-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
    'bg-rose-500', 'bg-amber-500',
    'bg-slate-500/80', 'bg-blue-500/80', 'bg-emerald-500/80', 'bg-violet-500/80',
  ],
  plugins: [],
}

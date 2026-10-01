/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-900': '#0f172a',
        'navy-800': '#1e293b',
        'navy-700': '#334155',
        'accent-orange': '#f97316',
        'accent-orange-hover': '#ea580c',
      }
    },
  },
  plugins: [],
}

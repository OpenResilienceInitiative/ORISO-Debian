/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'status-up': '#22c55e',
        'status-down': '#ef4444',
        'status-degraded': '#f59e0b',
      },
    },
  },
  plugins: [],
}

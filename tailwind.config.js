/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jw-green': '#0a3622',
        'jw-green-light': '#1e5138',
        'jw-gold': '#d4af37',
        'jw-gold-light': '#f3e5ab',
        'jw-gold-dark': '#aa8c2c',
        'jw-bg': '#f8fbf9',
      },
    },
  },
  plugins: [],
}

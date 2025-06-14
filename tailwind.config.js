/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}", // Added contexts
    "./hooks/**/*.{js,ts,jsx,tsx}",   // Added hooks
    "./utils/**/*.{js,ts,jsx,tsx}",   // Added utils
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true }), // Existing scrollbar plugin from package.json
  ],
}

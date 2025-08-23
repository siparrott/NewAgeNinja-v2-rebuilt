/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/**/*.{ts,tsx,js,jsx,html}",
    "./server/**/*.{ts,tsx,js,jsx}",
    "./public/**/*.html"
  ],
  theme: { 
    extend: {} 
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
}
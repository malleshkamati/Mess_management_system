/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D32F2F', // Red
        secondary: '#FFFFFF', // White
        accent: '#FFCDD2', // Light Red
      }
    },
  },
  plugins: [],
}

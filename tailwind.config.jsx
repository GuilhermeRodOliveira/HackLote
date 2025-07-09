/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ou qualquer outra fonte estilosa
      },
      colors: {
        dark: '#0d0d0d',
        'dark-blue': '#0a1f44',
      },
    },
  },
  plugins: [],
};

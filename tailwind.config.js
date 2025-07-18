/** @type {import('tailwindcss').Config} */
// Este arquivo agora usa a sintaxe ES Module (import/export)
// porque seu package.json tem "type": "module".
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        // Cores personalizadas que você possa querer adicionar
      },
    },
  },
  plugins: [],
};

export default config; // << ALTERADO AQUI PARA export default
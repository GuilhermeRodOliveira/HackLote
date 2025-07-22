// tailwind.config.js
/** @type {import('tailwindcss').Config} */
// Este arquivo agora usa a sintaxe ES Module (import/export)
// porque seu package.json tem "type": "module".
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Garante que src/ seja incluído
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        // Cores da Paleta "Eficiência Dinâmica" - Opção A (Ciano + Verde)
        primary: '#22D3EE',    // Ciano - Principal acento
        secondary: '#10B981',  // Verde Esmeralda - Acento secundário

        // Cores Neutras
        backgroundLight: '#F8FAFC', // Fundo principal
        textDark: '#1F2937',     // Texto principal
        textMuted: '#9CA3AF',    // Texto secundário, bordas

        // Cores de Status (Opcional: você pode manter os padrões do Tailwind ou usar estas)
        statusError: '#EF4444',
        statusSuccess: '#22C55E',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
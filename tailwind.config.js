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
      // Habilitando as cores dinâmicas via variáveis CSS
      colors: {
        // Cores base do tema
        backgroundPrimary: 'var(--bg-primary)',
        backgroundSecondary: 'var(--bg-secondary)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        borderColor: 'var(--border-color)', // Para bordas e elementos sutis
        
        // Cores de Acento das paletas
        accent1: 'var(--accent-1)', // Dourado antigo (escuro) / Azul escuro (claro)
        accent1Shade: 'var(--accent-1-shade)', // Para o hover de accent1
        accent2: 'var(--accent-2)', // Borgonha escuro (escuro) / Azul claro (claro)

        // Se você ainda precisar de cores de status fixas, pode mantê-las aqui
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
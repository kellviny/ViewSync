/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',    // Fundo geral (Slate 900)
          panel: '#1e293b', // Painéis (Slate 800)
          border: '#334155', // Bordas (Slate 700)
        },
        brand: {
          blue: '#3b82f6',  // Azul principal dos botões
          hover: '#2563eb', // Azul escuro no hover
        }
      }
    },
  },
  plugins: [],
}
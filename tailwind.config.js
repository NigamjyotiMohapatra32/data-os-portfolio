/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.jsx',
    './index.jsx',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        ink: '#06080f',
        panel: '#0c1322',
        panel2: '#111a2e',
        edge: '#1f2a44',
        cyan: {
          neon: '#22d3ee',
        },
        lime: {
          neon: '#34d399',
        },
        violet: {
          neon: '#a78bfa',
        },
        rose: {
          neon: '#f472b6',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a13',
        card: '#0f172a',
        primary: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          glow: 'rgba(139, 92, 246, 0.4)'
        },
        electric: {
          DEFAULT: '#00d2ff',
          glow: 'rgba(0, 210, 255, 0.4)'
        },
        danger: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          glow: 'rgba(239, 68, 68, 0.4)'
        },
        success: {
          DEFAULT: '#10b981',
          hover: '#059669',
          glow: 'rgba(16, 185, 129, 0.4)'
        }
      }
    },
  },
  plugins: [],
}


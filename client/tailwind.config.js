/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        prime: {
          bg: '#0f171e',
          card: '#1a242f',
          surface: '#253241',
          surfaceLight: '#2c3b4d',
          blue: '#00a8e1',
          blueHover: '#0082b3',
          yellow: '#f59e0b',
          amber: '#fbbf24',
          accent: '#00c3ff',
          muted: '#8197a4',
          border: '#2a3b4c',
          text: '#ffffff',
          seatBalcony: '#38bdf8',
          seatMiddle: '#a855f7',
          seatLower: '#10b981',
          seatBooked: '#ef4444',
          seatLocked: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'prime-card': '0 8px 24px -4px rgba(0, 0, 0, 0.7)',
        'prime-glow': '0 0 20px rgba(0, 168, 225, 0.35)',
        'prime-gold': '0 0 20px rgba(245, 158, 11, 0.35)',
      },
      scale: {
        '102': '1.02',
        '108': '1.08',
      }
    },
  },
  plugins: [],
}

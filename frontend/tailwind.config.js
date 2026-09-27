/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          base: '#F7FAFC',          // Soft off-white base canvas
          surface: '#EAF2F8',       // Powder blue tint for cards, sidebar, navbar
          elevated: '#DCEAF3',      // Light blue for modals, hover, active cards
          textPrimary: '#2C3E4A',   // Deep slate blue, not black
          textSecondary: '#7C93A3', // Muted blue-gray
          primary: '#4FA3D1',       // Sky blue primary accent / buttons / active nav
          primaryHover: '#3B8EBE',  // Deeper sky blue hover
          primaryLight: '#E5F3FA',  // Soft sky blue tint
          primaryBorder: '#A5CEE6', // Sky blue border
          success: '#5FBF8F',       // Mint green for safe/nominal status
          successLight: '#E8F8F0',  // Mint green tint
          successBorder: '#B1E4CB', // Mint green border
          warning: '#F2B84B',       // Warm amber for moderate risk
          warningLight: '#FEF7E8',  // Warm amber tint
          warningBorder: '#FADAA0', // Warm amber border
          danger: '#E85D5D',        // Coral red for critical/danger alerts
          dangerLight: '#FDECEC',   // Coral red tint
          dangerBorder: '#FACDCD',  // Coral red border
          border: '#C9DCE8',        // Soft blue-gray for dividers & card borders
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
        display: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(44, 62, 74, 0.05)',
        'soft-md': '0 4px 16px rgba(44, 62, 74, 0.08)',
        'soft-lg': '0 8px 24px rgba(44, 62, 74, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        tippa: {
          // Primary lime-green for main actions
          primary: '#DEFF00',
          // Secondary blue for secondary elements
          secondary: '#5B94D3',
          // Dark blue for headings and primary text
          accent: '#11468F',
          // Light blue background
          light: '#F0F8FF',
          // Neutral gray for secondary text
          neutral: '#6B7280',
          // Danger/error red
          danger: '#B01519',
          // Status colors
          success: '#10B981',
          warning: '#F59E0B',
          info: '#5B94D3',
          error: '#B01519',
          // Dark mode colors
          darkBg: '#0A0F1C',
          darkCard: '#1A2332',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Nunito-Regular'],
        medium: ['Nunito', 'Nunito-Medium'],
        semibold: ['Nunito', 'Nunito-SemiBold'],
        bold: ['Nunito', 'Nunito-Bold'],
      },
    },
  },
  plugins: [],
}
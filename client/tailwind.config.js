/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B4D3E",
        accent: "#FFB38A",
        secondary: "#D1F2EB",
        "text-light": "#F8FAFC",
        "text-dark": "#1B4D3E",
        "card-bg": "#FFFFFF",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
        display: ["Montserrat", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(209, 242, 235, 0.3)',
      },
    },
  },
  plugins: [],
}

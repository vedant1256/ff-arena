/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ff-bg": "#07070f",
        "ff-card": "#111118",
        "ff-card2": "#0d0d18",
        "ff-cyan": "#00e5ff",
        "ff-purple": "#7c3aed",
        "ff-green": "#10b981",
        "ff-gold": "#fbbf24",
        "ff-red": "#ef4444",
        "ff-pink": "#ff2d55",
      },
      fontFamily: {
        gaming: ["Orbitron", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #00e5ff, 0 0 10px #00e5ff" },
          "100%": { boxShadow: "0 0 10px #00e5ff, 0 0 20px #00e5ff, 0 0 30px #00e5ff" },
        },
      },
    },
  },
  plugins: [],
};

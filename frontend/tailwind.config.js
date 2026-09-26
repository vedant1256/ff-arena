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
        brand: {
          indigo: '#6366F1',
          violet: '#7C3AED',
          mint: '#10B981',
          teal: '#06B6D4',
          amber: '#F59E0B',
          coral: '#FF4655',
          bgLight: '#F8FAFC',
          cardLight: '#FFFFFF',
          surfaceMuted: '#F1F5F9',
          borderLight: '#E2E8F0',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
          textMuted: '#64748B',
        },
        "ff-bg": "#F8FAFC",
        "ff-card": "#FFFFFF",
        "ff-card2": "#F1F5F9",
        "ff-cyan": "#06B6D4",
        "ff-purple": "#7C3AED",
        "ff-green": "#10B981",
        "ff-gold": "#F59E0B",
        "ff-red": "#FF4655",
        "ff-pink": "#FF2D55",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        gaming: ['Rajdhani', 'Trebuchet MS', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card-subtle': '0 2px 8px -2px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(99, 102, 241, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        'glow-primary': '0 6px 20px -3px rgba(99, 102, 241, 0.35)',
        'glow-mint': '0 4px 14px -2px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #6366F1, 0 0 10px #6366F1" },
          "100%": { boxShadow: "0 0 10px #6366F1, 0 0 20px #6366F1, 0 0 30px #7C3AED" },
        },
      },
    },
  },
  plugins: [],
};

module.exports = {
  content: ['./index.html'],
  safelist: ['hidden', 'bg-forge-steel/60', 'font-semibold', 'text-white', 'rounded-md'],
  theme: {
    extend: {
      colors: {
        forge: { dark: '#0f0f0f', charcoal: '#1a1a1a', steel: '#2a2a2a', accent: '#e63946', glow: '#ff6b35' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'system-ui', 'sans-serif'],
      },
    },
  },
};

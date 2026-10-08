/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          bg: '#0B0F19',          // Deepest Cyber Space
          card: '#111827',        // Solid Elevated Surface
          cardHover: '#1F2937',   // Card Hover state
          border: '#374151',      // Subtle separation
          borderGlow: '#8B5CF6',  // Neon Purple boundary
          primary: '#8B5CF6',     // Core Neon Violet
          primaryLight: '#A78BFA',
          accent: '#10B981',      // Emerald Pulse (Healthy status)
          accentWarn: '#F59E0B',  // Amber warning
          accentRose: '#F43F5E',  // Rose emergency
          cyan: '#06B6D4',        // Cyan telemetry
          text: '#F9FAFB',        // Crisp White
          muted: '#9CA3AF',       // Subdued gray
        }
      },
      fontFamily: {
        sans: ['Cairo', 'Plus Jakarta Sans', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-glow': '0 0 25px -5px rgba(139, 92, 246, 0.35)',
        'emerald-glow': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'cyan-glow': '0 0 20px -5px rgba(6, 182, 212, 0.35)',
      }
    },
  },
  plugins: [],
}

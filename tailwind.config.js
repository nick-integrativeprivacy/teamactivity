/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        spotify: "#20B85A",
        ink: "#214237",
        panel: "#FFFFFF",
        surface: "#F8FFF7",
        leaf: "#276749",
        meadow: "#CDEFD3",
        blush: "#FFE8DD",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(32, 184, 90, 0.18), 0 18px 44px rgba(39, 103, 73, 0.16)",
        cloud: "0 18px 42px rgba(39, 103, 73, 0.13)",
      },
    },
  },
  plugins: [],
};

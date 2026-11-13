/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        haven: {
          orange: {
            deep: "#ed5615",
            bright: "#fa681b",
            mid: "#fc8616",
          },
          green: {
            DEFAULT: "#b8c220",
            deep: "#97a01a",
          },
          yellow: "#ffd059",
          butter: "#ffe382",
          brown: {
            dark: "#b8774a",
            light: "#dda47d",
          },
          blue: {
            deep: "#2cbf90",
          },
        },
      },
      fontFamily: {
        display: ["'Jua'", "sans-serif"],
        body: ["system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        tactile: "0 4px 0 0 #b8774a",
        "tactile-active": "0 1px 0 0 #b8774a",
        card: "0 8px 0 0 rgba(184, 119, 74, 0.4)",
      },
    },
  },
  plugins: [],
};

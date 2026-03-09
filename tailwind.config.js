/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A73E8",
        ink: {
          primary: "#0F172A",
          secondary: "#475569",
          disabled: "#94A3B8",
        },
        surface: {
          app: "#F8FAFC",
          card: "#FFFFFF",
        },
        "border-soft": "#E2E8F0",
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#0EA5E9",
        },
        flow: {
          inbound: "#1A73E8",
          outbound: "#0EA5E9",
          transfer: "#8B5CF6",
        },
      },
      boxShadow: {
        "apple-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "apple-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "apple-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        "apple-inset": "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
        flat: "none",
      },
      borderRadius: {
        card: "1rem",
        card2: "0.75rem",
      },
    },
  },
  plugins: [],
};

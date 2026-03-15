import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        wiki: {
          page: "#F8F9FA",
          paper: "#FFFFFF",
          text: "#202122",
          muted: "#54595D",
          border: "#A2A9B1",
          blue: "#0645AD",
          red: "#CC2200",
          infobox: "#A7D7F9",
          badge: "#EAECF0"
        }
      },
      fontFamily: {
        heading: ["Georgia", "\"Times New Roman\"", "serif"],
        body: ["Arial", "\"Helvetica Neue\"", "sans-serif"]
      },
      boxShadow: {
        wiki: "0 1px 2px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

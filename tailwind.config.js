/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['var(--font-inter)', 'sans-serif'],
        'lobster': ['var(--font-lobster)', 'cursive'],
        'primary': ['var(--font-primary)', 'sans-serif'],
        'secondary': ['var(--font-secondary)', 'sans-serif'],
        'sans': ['var(--font-inter)', 'Arial', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

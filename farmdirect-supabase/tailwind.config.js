/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#EAF3DE',
          100: '#D4E8BC',
          200: '#C0DD97',
          300: '#A0CC6A',
          400: '#7DB83E',
          500: '#639922',
          600: '#4E7E18',
          700: '#3B6D11',
          800: '#27500A',
          900: '#163505',
        },
      },
    },
  },
  plugins: [],
};

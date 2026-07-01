/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Paleta "Norte": azul profundo de noite estrelada + dourado de bussola
        norte: {
          950: '#0b1120',
          900: '#111a30',
          800: '#1b2a4a',
          700: '#28406b',
          accent: '#e0a944',
          'accent-light': '#f2c979',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

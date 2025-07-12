const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

/** @type {import('postcss').Config} */
module.exports = {
  plugins: [
    tailwindcss(),   // Tailwind v4+ PostCSS plugin
    autoprefixer()   // vendor‑prefixes
  ]
};
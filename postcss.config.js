const autoprefixer = require('autoprefixer');
const tailwindcss = require('tailwindcss');
const tailwindConfig = require('./tailwind.config');
module.exports = {
  plugins: [autoprefixer(), tailwindcss(tailwindConfig)],
};

const sharp = require('sharp');
sharp('public/assets/logo.webp')
  .toFile('public/assets/logo.png')
  .then(() => console.log('Done'))
  .catch(console.error);

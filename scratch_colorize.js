const fs = require('fs');
let svg = fs.readFileSync('public/srm-logo-circle.svg', 'utf8');
svg = svg.replace(/fill="white"/g, 'fill="#034DA1"');
fs.writeFileSync('public/srm-logo-circle.svg', svg);
console.log('Done');

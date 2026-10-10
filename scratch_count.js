const fs = require('fs');
const svg = fs.readFileSync('public/srm-logo-white.svg', 'utf8');
const gci = svg.indexOf('<path fill-rule="evenodd" clip-rule="evenodd" d="M178 89.0002C178');
const before = svg.substring(0, gci);
console.log('Number of paths before golden circle:', (before.match(/<path/g)||[]).length);

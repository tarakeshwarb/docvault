const fs = require('fs');
const svg = fs.readFileSync('public/srm-logo-white.svg', 'utf8');

const goldenCircleIndex = svg.indexOf('<path fill-rule="evenodd" clip-rule="evenodd" d="M178 89.0002C178');

if (goldenCircleIndex !== -1) {
  let newSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="178" height="178" viewBox="0 0 178 178" fill="none">' + svg.substring(goldenCircleIndex);
  fs.writeFileSync('public/srm-logo-circle.svg', newSvg);
  console.log('Successfully recreated srm-logo-circle.svg without color changes');
} else {
  console.log('Could not find the golden circle path.');
}

const fs = require('fs');

const svg = fs.readFileSync('public/srm-logo-white.svg', 'utf8');

// The first three path elements correspond to the "S", "R", and "M" letters
// We will find the golden circle which is <path fill-rule="evenodd" clip-rule="evenodd" d="M178 89... fill="#C7A008"></path>
const goldenCircleIndex = svg.indexOf('<path fill-rule="evenodd" clip-rule="evenodd" d="M178 89.0002C178');

if (goldenCircleIndex !== -1) {
  // Keep everything from the golden circle onwards, and prepend the opening <svg> tag with new dimensions
  let newSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="178" height="178" viewBox="0 0 178 178" fill="none">' + svg.substring(goldenCircleIndex);
  
  fs.writeFileSync('public/srm-logo-circle.svg', newSvg);
  console.log('Successfully created srm-logo-circle.svg');
} else {
  console.log('Could not find the golden circle path.');
}

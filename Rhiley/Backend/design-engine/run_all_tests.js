const { execSync } = require('child_process');
const fs = require('fs');

const images = [
  'WEB1.png', 'WEB1.png',
  'WEB2.png', 'WEB2.png',
  'WEB3.jpg', 'WEB3.jpg',
  'WEB4.jpg', 'WEB4.jpg',
  'WEB5.jpg', 'WEB5.jpg'
];

let i = 1;
for (const img of images) {
  const logFile = `test_${img.split('.')[0]}_${i}.log`;
  console.log(`Running test for ${img} -> ${logFile}`);
  try {
    const output = execSync(`node scratch_test_full_build.js "test-images\\${img}"`, { encoding: 'utf8' });
    fs.writeFileSync(logFile, output, 'utf8');
  } catch (err) {
    fs.writeFileSync(logFile, err.stdout + "\n" + err.stderr, 'utf8');
  }
  i = (i === 1) ? 2 : 1;
}
console.log("All tests completed!");

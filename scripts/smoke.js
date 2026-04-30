const fs = require('fs');
const path = require('path');

const root = process.cwd();
const required = [
  'main.js',
  'preload.js',
  'src/index.html',
  'src/styles.css',
  'src/app.js',
  'package.json'
];

let failed = false;
for (const rel of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${rel}`);
    failed = true;
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (!pkg.version) {
  console.error('INVALID: package.json missing version');
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('Smoke checks passed.');

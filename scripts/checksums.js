const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dist = path.join(process.cwd(), 'dist');
if (!fs.existsSync(dist)) {
  console.error('dist/ not found');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(dist).filter((f) => !f.endsWith('.blockmap') && !f.endsWith('.yml'));
const lines = [];
for (const file of files) {
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  lines.push(`${hash}  ${path.relative(process.cwd(), file)}`);
}

const outPath = path.join(dist, 'SHA256SUMS.txt');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${outPath}`);

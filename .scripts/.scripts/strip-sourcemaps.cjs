const fs = require('fs');
const path = require('path');

function stripFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const backupPath = filePath + '.bak';
  if (!fs.existsSync(backupPath)) fs.writeFileSync(backupPath, content, 'utf8');
  // Remove `//# sourceMappingURL=...` and `//@ sourceMappingURL=...` style comments
  const stripped = content.replace(/\/\/[#@]\s*sourceMappingURL=.*$/gm, '');
  fs.writeFileSync(filePath, stripped, 'utf8');
  return true;
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node strip-sourcemaps.js <file-or-dir>');
    process.exit(2);
  }
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    stripFile(target);
    console.log('Stripped:', target);
    return;
  }
  const files = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  }
  walk(target);
  for (const f of files) stripFile(f);
  console.log('Stripped', files.length, 'files under', target);
}

main();

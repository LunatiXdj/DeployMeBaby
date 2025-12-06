const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../.next/dev/server/chunks/ssr/node_modules_7dabdcc6._.js');
if (!fs.existsSync(target)) {
  console.error('Target not found:', target);
  process.exit(2);
}
let src = fs.readFileSync(target, 'utf8');

// Remove any trailing sourceMappingURL-like comments (both single-line and block)
// and any occurrences of "# sourceMappingURL" or "//# sourceMappingURL" or "/*# sourceMappingURL=... */"
src = src.replace(/\/\*#? sourceMappingURL=[^*]*\*\//g, '');
src = src.replace(/\/\/\#? sourceMappingURL=.*$/gmi, '');
src = src.replace(/\/\/\#? sourceMapURL=.*$/gmi, '');
src = src.replace(/sourceMapURL=[^)\n;]*/gmi, '');

fs.writeFileSync(target, src, 'utf8');
console.log('Stripped sourceMappingURL-like entries from', target);

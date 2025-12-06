const fs = require('fs');
const path = require('path');

/**
 * Fix Turbopack source map bug: strip all invalid sourceMappingURL comments
 * from .next/dev/server/chunks/ssr/*.js files
 */
function stripSourceMapFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Remove `//# sourceMappingURL=...` and `//@ sourceMappingURL=...` style comments
    const stripped = content.replace(/\/\/[#@]\s*sourceMappingURL=.*$/gm, '');
    fs.writeFileSync(filePath, stripped, 'utf8');
    return true;
  } catch (err) {
    console.error(`Failed to strip ${filePath}:`, err.message);
    return false;
  }
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (stat.isFile() && filePath.endsWith('.js')) {
      callback(filePath);
    }
  }
}

function main() {
  const serverChunksDir = path.join(process.cwd(), '.next', 'dev', 'server', 'chunks', 'ssr');
  if (!fs.existsSync(serverChunksDir)) {
    console.log(`⚠️  Server chunks dir does not exist yet: ${serverChunksDir}`);
    return;
  }

  console.log(`🔧 Stripping invalid source map comments from ${serverChunksDir}...`);
  let count = 0;
  walkDir(serverChunksDir, (file) => {
    if (stripSourceMapFromFile(file)) {
      count++;
      console.log(`✓ Stripped: ${path.relative(process.cwd(), file)}`);
    }
  });
  console.log(`✅ Done. Stripped ${count} files.`);
}

main();

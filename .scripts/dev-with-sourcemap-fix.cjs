#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

/**
 * Wrapper script: Start Next.js dev server and aggressively monitor/strip source maps.
 * This solves the Turbopack source map bug where invalid sourceMappingURL comments are added to server chunks.
 */

const serverChunksDir = path.join(process.cwd(), '.next', 'dev', 'server', 'chunks', 'ssr');
const staticChunksDir = path.join(process.cwd(), '.next', 'dev', 'static', 'chunks');
let fixCount = 0;

function stripSourceMapFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const stripped = content.replace(/\/\/[#@]\s*sourceMappingURL=.*$/gm, '');
    if (stripped !== content) {
      fs.writeFileSync(filePath, stripped, 'utf8');
      fixCount++;
    }
  } catch (err) {
    // Silently ignore errors (file may be locked or deleted)
  }
}

function stripAllChunks() {
  [serverChunksDir, staticChunksDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      const walkDir = (dirPath) => {
        fs.readdirSync(dirPath).forEach(file => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            walkDir(filePath);
          } else if (filePath.endsWith('.js')) {
            stripSourceMapFromFile(filePath);
          }
        });
      };
      walkDir(dir);
    }
  });
}

function watchChunksDir() {

  // Use basic fs.watch with aggressive polling since chokidar is not available
  const checkChunks = setInterval(() => {
    [serverChunksDir, staticChunksDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        try {
          fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            if (entry.isFile() && entry.name.endsWith('.js')) {
              stripSourceMapFromFile(path.join(dir, entry.name));
            }
          });
        } catch (err) {
          // Ignore errors from concurrent file access
        }
      }
    });
  }, 500);

  return checkChunks;
}

// Start Next.js dev server
// Note: Turbopack is default in Next.js 15+, but we try to use webpack
const nextDev = spawn('next', ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    TURBOPACK: '0',
    TURBO: '0',
    __NEXT_DISABLE_TURBOPACK: '1'
  }
});

// Immediately strip any existing chunks, then watch for new ones
stripAllChunks();
const checkInterval = setTimeout(watchChunksDir, 1000);

// Handle process termination
process.on('SIGINT', () => {
  if (checkInterval) clearTimeout(checkInterval);
  nextDev.kill();
  process.exit(0);
});

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
  process.exit(1);
});

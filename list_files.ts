import { readdir } from 'fs/promises';
import { join } from 'path';

async function listFiles(dir: string) {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        console.log(`DIR: ${path}`);
        await listFiles(path);
      } else {
        console.log(`FILE: ${path}`);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
}

listFiles('/workspaces/PH-Services/app');
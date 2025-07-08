import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILTIN_STAGES_DIR = path.join(__dirname, '..', 'stages');

/**
 * Checks if a local stage override exists in <project>/stages/<stageName>/index.js.
 * If not, falls back to built-in stage in bookpub.
 */
export async function importStage(stageName) {
  // 1. Local override
  const localPath = path.join(process.cwd(), 'stages', stageName, 'index.js');
  if (fs.existsSync(localPath)) {
    return await import(`file://${localPath}`);
  }

  // 2. Built-in
  const builtInPath = path.join(BUILTIN_STAGES_DIR, stageName, 'index.js');
  if (fs.existsSync(builtInPath)) {
    return await import(`file://${builtInPath}`);
  }

  throw new Error(`No local or built-in stage found for "${stageName}".`);
}

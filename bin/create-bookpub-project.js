#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * This file is an alias for `bookpub new <projectName>`.
 * So, if someone runs `npx create-bookpub-project my-book`,
 * we simply spawn the main "bookpub.js" with "new my-book".
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The first 2 args are the node process and script path, so slice them off
const args = process.argv.slice(2); // e.g. ["my-book", ...]

const binPath = path.join(__dirname, 'bookpub.js');

// Spawn the "bookpub new" command with the user’s arguments
const child = spawn(process.argv[0], [binPath, 'new', ...args], { stdio: 'inherit' });
child.on('close', (code) => {
  process.exit(code);
});

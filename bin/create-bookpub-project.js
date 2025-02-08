#!/usr/bin/env node
/**
 * @module createBookpubProject
 * @description
 * This script serves as an alias for creating a new Bookpub project.
 * When a user runs:
 *
 *   npx create-bookpub-project my-book
 *
 * it internally spawns the main Bookpub CLI with the `new` command:
 *
 *   bookpub new my-book
 *
 * This ensures that users have a consistent, simplified command for scaffolding
 * a new Bookpub project.
 *
 * @example
 * // To create a new project called "my-book":
 * npx create-bookpub-project my-book
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Retrieve all command-line arguments after the node executable and script path.
const args = process.argv.slice(2); // e.g. ["my-book", ...]

// Define the path to the main "bookpub.js" CLI file.
const binPath = path.join(__dirname, 'bookpub.js');

// Spawn the "bookpub new" command with the user’s arguments.
const child = spawn(process.argv[0], [binPath, 'new', ...args], { stdio: 'inherit' });

// When the spawned process closes, exit with the same exit code.
child.on('close', (code) => {
  process.exit(code);
});

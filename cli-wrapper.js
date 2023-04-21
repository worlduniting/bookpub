#!/usr/bin/env node

// With --verbose flag, run with node --trace-warnings
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeArgs = ['--trace-warnings'];
const script = path.join(__dirname, 'cli.js');
const args = process.argv.slice(2);

const child = spawn(process.execPath, [...nodeArgs, script, ...args], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code);
});

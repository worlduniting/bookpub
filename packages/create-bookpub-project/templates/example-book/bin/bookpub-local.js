#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2).join(' ');

console.log('Running bookpub with args: ' + args);

const command = path.join(__dirname, 'node_modules', '.bin', 'bookpub') + ' ' + args);

// Print a message to the console
console.log('Running local bookpub with command:', command);

execSync(command, { stdio: 'inherit' });

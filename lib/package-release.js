import fs from 'fs';
import { execSync } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Convert file URL to path for compatibility with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, '..');

// Load package.json
const packageJsonRaw = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');
const packageJson = JSON.parse(packageJsonRaw);

// Load .gitignore
const gitignoreRaw = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf-8').split('\n');

// Ignore comments and empty lines in .gitignore
const gitignore = gitignoreRaw.filter(line => line.trim() !== '' && !line.trim().startsWith('#'));

// Prepare command options
const version = packageJson.version;
const status = packageJson.status; // Assuming you have "status" field in your package.json
const tarName = `bookpub-${version}-${status}.tar.gz`;
const excludeArgs = gitignore.concat('.git').map(file => `--exclude=${file}`).join(' ');

// Build command
const command = `tar -czvf ${tarName} ${excludeArgs} -C ${rootDir} .`;

// Execute command
execSync(command, { stdio: 'inherit' });

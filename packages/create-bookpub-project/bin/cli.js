#!/usr/bin/env node

import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import createBookPubProject from '../lib/create-bookpub-project.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = process.env.TEST_PACKAGE_JSON || JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();
program.version(packageJson.version);

// Help command
program
    .command('help')
    .description('Display help information')
    .alias('h')
    .action(() => {
        program.help();
    });

// Version command
program
    .command('version')
    .description('Display the current version of the package')
    .alias('v')
    .action(() => {
        console.log(packageJson.version);
    });

program
    .exitOverride()
    .description('Create a new BookPub book project')
    .argument('[projectName]', 'Name of the new project')
    .action(async (projectName) => {
        // Check if 'bookpub' is installed globally
        try {
            console.log(`Checking if 'bookpub' is installed globally...`);
            const npmListOutput = await runCommand('npm', ['list', '-g', '--depth=0'], { stdio: 'pipe' });
            console.log('npmListOutput', npmListOutput);
            const cleanedOutput = npmListOutput.replace(/\r?\n|\r/g, " ");
            if (!/\bbookpub@\b/.test(cleanedOutput)) {
                console.log(`'bookpub' is not installed globally. Installing it now...`);
                await runCommand('npm', ['install', '-g', 'bookpub'], { stdio: 'inherit' });
            } else {
                console.log(`'bookpub' is installed globally.`);
            }
        } catch (error) {
            console.error(`Failed to check/install 'bookpub' globally: ${error.message}\nPlease make sure you are connected to the internet and try again.`);
            process.exit(1);
        }

        // Check if the user has provided a project name
        if (!projectName) {
            // Set projectName to my-book
            projectName = 'my-book'
        }

        console.log('\n')
        // Create the new project
        await createBookPubProject(projectName);

        // Get the path to the new project directory
        const projectDir = path.join(process.cwd(), projectName);

        // After the project has been created, initialize git
        console.log(`Initializing git.`);
        try {
            await runCommand('git', ['init'], { stdio: 'inherit', shell: true, cwd: projectDir });
            console.log(chalk.greenBright(`Git initialization completed successfully.\n`));
        } catch (error) {
            console.log(chalk.magentaBright(`\nFailed to initialize git.\n\nYou may need to run \'git init\' manually inside your new project.\n`));
        }

        // After git has been initialized (or failed to initialize), run npm install
        console.log(`Initializing dependencies:`);
        console.log(chalk.cyanBright('- chalk\n- bookpub\n'));
        try {
            await runCommand('npm', ['install'], { stdio: 'inherit', shell: true, cwd: projectDir });
            console.log(chalk.greenBright(`npm install completed successfully.`));
            // Success message...
        } catch (error) {
            console.log(chalk.magentaBright(`\nFailed to install dependencies.\n\nYou may need to run \'npm install\' manually inside your new project.\n`));
            process.exit(1);
        }
    });

try {
    program.parse(process.argv);
} catch (err) {
    if (err.code === 'commander.unknownOption') {
        console.error(`\nUnknown option: ${err.message}\n`);
        program.outputHelp();
    }
}

async function runCommand(command, args, options) {
    return new Promise((resolve, reject) => {
        const spawnedProcess = spawn(command, args, options);

        let output = '';
        if (options.stdio === 'pipe') {
            spawnedProcess.stdout.on('data', (data) => {
                output += data;
            });
        }

        spawnedProcess.on('error', (error) => {
            reject(error);
        });

        spawnedProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command exited with code ${code}`));
            } else {
                resolve(output);
            }
        });
    });
}


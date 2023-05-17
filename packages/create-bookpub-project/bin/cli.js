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
        if (!projectName) {
            // Set projectName to my-book
            projectName = 'my-book'
        }
        console.log('\n')
        await createBookPubProject(projectName);

        // Get the path to the new project directory
        const projectDir = path.join(process.cwd(), projectName);

        // After the project has been created, run npm install
        console.log(`Initializing dependencies:`);
        console.log(chalk.cyanBright('- chalk\n- bookpub\n'));
        const npmInstall = spawn('npm', ['install'], { stdio: 'inherit', shell: true, cwd: projectDir });

        npmInstall.on('error', (err) => {
            console.error(`Failed to start npm install: ${err.message}`);
            process.exit(1);
        });

        npmInstall.on('exit', (code) => {
            if (code !== 0) {
                console.log(chalk.magentaBright(`\nFailed to install dependencies.\n\nYou may need to run \'npm install\' manually inside your new project.\n`));
                process.exit(code);
            } else {
                console.log(chalk.greenBright(`npm install completed successfully.`));
                console.log(chalk.yellowBright(
                    `     Success! We're all finished!\n\n` +
                    `     (1) You can change into your new project directory: ${chalk.white(`\'cd ${projectName}\'`)}\n\n` +
                    `     (2) Run: ${chalk.white('\'bookpub dev -t html\'')} to build and view your new book in Dev Mode.\n\n`
                ));
            }
        });
    });

try {
    program.parse(process.argv);
} catch (err) {
    if (err.code === 'commander.unknownOption') {
        console.error(`\nUnknown option: ${err.message}\n`);
        program.outputHelp();
    }
}

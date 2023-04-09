#!/usr/bin/env node

// cli.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import convert from './lib/convert.js';
import path from 'path';
import nodemon from 'nodemon';
import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));

const manuscriptDir = path.join(process.cwd(), 'manuscript');

const program = new Command();
program.version(packageJson.version);

async function buildHtml(manuscriptDir, outputDir, outputType) {
    await convert(manuscriptDir, outputDir, outputType);
}

async function buildPdf(manuscriptDir, outputDir, outputType) {
    await buildHtml(manuscriptDir, outputDir, outputType);

    // Run the prince command-line tool
    const prince = spawn('prince', ['build/pdf/index.html'], { stdio: 'inherit' });

    prince.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });

    return prince;
}

program
    .command('build')
    .option('-t, --type <type>', 'Specify the output type (html or pdf)', 'html')
    .description('Build the output from the manuscript markdown files')
    .action(async (options) => {
        console.log(`Building ${options.type.toUpperCase()}...`);

        if (options.type === 'html') {
            await buildHtml(manuscriptDir, path.join(process.cwd(), 'build', 'html'), options.type);
        } else if (options.type === 'pdf') {
            await buildPdf(manuscriptDir, path.join(process.cwd(), 'build', 'pdf'), options.type);
        } else {
            console.error('Invalid output type specified. Use either "html" or "pdf".');
        }
    });

program
    .command('dev')
    .option('-t, --type <type>', 'Specify the output type (html or pdf)', 'html')
    .description('Run the development server with live-reloading')
    .action(async (options) => {
        console.log(`Running Nodemon and Webpack Server for ${options.type.toUpperCase()}...`);

        if (options.type === 'html') {
            await buildHtml(manuscriptDir, path.join(process.cwd(), 'build', 'html'), options.type);
            await runWebpackDevServerAsync('html');
            await runNodemonAsync('html');
        } else if (options.type === 'pdf') {
            await buildPdf(manuscriptDir, path.join(process.cwd(), 'build', 'pdf'), options.type);
            await runWebpackDevServerAsync('pdf');
            await runNodemonAsync('pdf');
        } else {
            console.error('Invalid output type specified. Use either "html" or "pdf".');
        }
    });

// Setup nodemon function to return as a Promise
function runNodemonAsync(outputType) {
    return new Promise((resolve, reject) => {
        runNodemon(outputType).on('quit', resolve).on('error', reject);
    });
}

// Run the webpack server using the user's webpack.config.js
function runWebpackDevServerAsync(outputType) {
    const server = spawn(
        'npx',
        ['webpack', 'serve', '--env', `outputType=${outputType}`],
        { stdio: 'inherit' }
    );

    server.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });

    return server;
}

// Use Nodemon to watch for changes and rebuild/serve/refresh

// Helper function to validate the user's nodemon.json file
function validateUserNodemonConfig(config) {
    if (!config || !config.execMap || !config.execMap.html) {
        return false;
    }
    return true;
}

function runNodemon(outputType) {
    const userNodemonConfigPath = path.join(process.cwd(), 'nodemon.json');
    let nodemonConfig = {};

    // Check if the user's nodemon.json file exists
    if (existsSync(userNodemonConfigPath)) {
        const userNodemonConfig = JSON.parse(readFileSync(userNodemonConfigPath, 'utf-8'));

        // Validate the user's nodemon.json configuration
        if (validateUserNodemonConfig(userNodemonConfig)) {
            nodemonConfig = { configFile: userNodemonConfigPath };
        }
    }

    // If the user's nodemon.json file is not found or is not valid, use default settings
    if (!nodemonConfig.configFile) {
        console.log(`Using default Nodemon settings with outputType: ${outputType}.`);
        nodemonConfig = {
            script: __filename,
            ext: outputType === 'pdf' ? 'md,mdx,js,ejs,json,html,css,scss,yaml' : 'md,mdx,js,ejs,json,html,css,scss,yaml',
            exec: `bookshop build --type ${outputType}`,
            watch: 'manuscript',
        };
    }

    return nodemon(nodemonConfig).on('restart', async () => {
        console.log(`Rebuilding ${outputType.toUpperCase()}...`);
        if (outputType === 'html') {
            await buildHtml(manuscriptDir, path.join(process.cwd(), 'build', 'html'), outputType);
        } else if (outputType === 'pdf') {
            await buildPdf(manuscriptDir, path.join(process.cwd(), 'build', 'pdf'), outputType);
        }
    });
}


program.parseAsync(process.argv);
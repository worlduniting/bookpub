#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { build } from '../src/commands/build.js';
import { newProject } from '../src/commands/new.js';
import { dev } from '../src/commands/dev.js';

program
  .name('bookpub')
  .description('A modular pipeline for building books from EJS + Markdown')
  .version('1.0.0');

// Build command
program
  .command('build [buildtype]')
  .description('Builds the manuscript into the specified output format (pdf, epub, html, etc.)')
  .action(async (buildtype) => {
    await build({ buildtype });
  });

// New project command
program
  .command('new <projectName>')
  .description('Create a new BookPub project')
  .action(async (projectName) => {
    console.log(chalk.greenBright(`\nLet's create your new book project: ${chalk.yellowBright(projectName)}\n`));
    await newProject(projectName);
  });

// Dev command
program
  .command('dev <buildType>')
  .description('Run Bookpub in development mode with live reloading')
  .action(async (buildType) => {
    await dev(buildType);
  });

// Parse arguments
program.parse(process.argv);

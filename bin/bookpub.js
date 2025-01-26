#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { build } from '../src/commands/build.js';
import { newProject } from '../src/commands/new.js';

/**
 * Main CLI entry point.
 * Defines subcommands like "build" and "new".
 */
program
  .name('bookpub')
  .description('A modular pipeline for building books from EJS + Markdown')
  .version('1.0.0');

// "build" subcommand
program
  .command('build [buildtype]')
  .description('Builds the manuscript into the specified output format (pdf, epub, etc.)')
  .action(async (buildtype) => {
    await build({ buildtype });
  });

// "new" subcommand
program
  .command('new <projectName>')
  .description('Create a new BookPub project')
  .action(async (projectName) => {
    console.log(chalk.greenBright(`\nLet's create your new book project: ${chalk.yellowBright(projectName)}\n`));
    await newProject(projectName);
  });

// Parse
program.parse(process.argv);

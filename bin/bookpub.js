#!/usr/bin/env node
/**
 * @fileOverview
 * Entry point for the Bookpub CLI application.
 *
 * Bookpub is a modular pipeline tool for building books from EJS + Markdown.
 * It supports multiple build pipelines (HTML, PDF, EPUB, etc.), project scaffolding,
 * and live reloading in development mode.
 *
 * Available Commands:
 *   - build [buildtype]: Builds the manuscript into the specified output format.
 *     Example: `bookpub build html`
 *
 *   - new <projectName>: Scaffolds a new Bookpub project with the necessary boilerplate.
 *     Example: `bookpub new my-book`
 *
 *   - dev <buildType>: Runs Bookpub in development mode with live reloading.
 *     Example: `bookpub dev html`
 *
 * @module bookpubCLI
 * @requires commander
 * @requires chalk
 * @requires ../src/commands/build.js
 * @requires ../src/commands/new.js
 * @requires ../src/commands/dev.js
 */

import { program } from 'commander';
import chalk from 'chalk';
import { build } from '../src/commands/build.js';
import { newProject } from '../src/commands/new.js';
import { dev } from '../src/commands/dev.js';

program
  .name('bookpub')
  .description('A modular pipeline for building books from EJS + Markdown')
  .version('1.0.0');

/**
 * Build Command
 * @example
 * // Build an HTML version of your manuscript:
 * bookpub build html
 */
program
  .command('build [buildtype]')
  .description(`${chalk.greenBright('Builds the manuscript into the specified output format (pdf, epub, html, etc.)')}\n\n`)
  .action(async (buildtype) => {
    await build({ buildtype });
  });

/**
 * New Project Command
 * @example
 * // Create a new Bookpub project named "my-book":
 * bookpub new my-book
 */
program
  .command('new <projectName>')
  .description(`${chalk.greenBright('Create a new BookPub project')}\n\n`)
  .action(async (projectName) => {
    console.log(chalk.greenBright(`\nLet's create your new book project: ${chalk.yellowBright(projectName)}\n`));
    await newProject(projectName);
  });

/**
 * Development Command
 * @example
 * // Run Bookpub in development mode for an HTML build:
 * bookpub dev html
 */
program
  .command('dev <buildType>')
  .description(`${chalk.greenBright('Run Bookpub in development mode:')}
                    * Serve the build asset via browser localhost:3000
                    * Watch for changes and live reload\n`)
  .action(async (buildType) => {
    await dev(buildType);
  });


// Parse command-line arguments.
program.parse(process.argv);

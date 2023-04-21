import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import lintEjs from './lint-ejs.js';
import renderEjs from './render-ejs.js';
import processSmartypants from './process-smartypants.js';
import { compileSCSSToCSS } from './compile-scss.js';
import chalk from 'chalk';

//--------------------
// CONVERT MANUSCRIPT INTO BUILD TYPE
//--------------------
export default async function convert(manuscriptDir, outputDir, outputType) {
    try {
        // Make Sure It Only Runs Once
        // Set initial run variable to false (true if run)
        let hasRun = false;
        if (hasRun) {
            return;
        }
        hasRun = true;

        // Load Book Config Options
        // --------------------
        let book;
        try {
            book = yaml.load(fs.readFileSync(path.join(manuscriptDir, '../book.config.yml'), 'utf8'));
        } catch (error) {
            console.error(chalk.red('Error Loading book.config.yml:'), chalk.red(error));
        }

        // Set Function Constants
        // --------------------

        // Book Manuscript Entry File/Path
        const entryFile = book.settings.entryfile;
        const entryPath = path.join(manuscriptDir, entryFile);

        // Book's Build Output Location
        const outputFile = path.join(outputDir, 'index.html');

        // Create Output Directory (if it doesn't exist)
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Lint the EJS Content (Check for Errors)
        // --------------------
        console.log('Loading manuscript...\n');
        const ejsLintOpt = book['ejs-lint-options']
        const ejsContent = fs.readFileSync(entryPath, 'utf8');

        let lintedEjs; // Declare the variable outside the try block
        try {
            console.log('Checking for Errors in EJS Content...\n');
            lintedEjs = await lintEjs(ejsContent, ejsLintOpt); // Assign the value inside the try block
        } catch (error) {
            console.error(chalk.red('EJS Linting Error:'), chalk.red(error));
        }

        // Render the Linted EJS Content
        // --------------------
        let processedEJS;
        try {
            // Render the Linted EJS Content
            console.log('\nProcessing EJS files...\n')
            processedEJS = await renderEjs(lintedEjs, book, outputType, manuscriptDir, path);
        } catch (error) {
            console.error(chalk.red('EJS Rendering Error:'), chalk.red(error));
        }

        // Use Smartypants to process symbols and quotes
        // --------------------
        let smartyHtml; // Declare the variable outside the try block
        try {
            console.log("\nConverting symbols to smart symbols with...\n");
            smartyHtml = await processSmartypants(processedEJS);
        } catch (error) {
            console.error(chalk.red('Smartypants Processing Error:'), chalk.red(error));
        }


        // Write Final Build Output
        // --------------------
        console.log("Writing final build to " + outputFile)
        fs.writeFileSync(outputFile, smartyHtml);

        // Copy Manuscript Theme to Build Location
        // --------------------
        const themeSrcDir = path.join(manuscriptDir, 'theme');
        const themeDestDir = path.join(outputDir, 'theme');
        console.log("\nCopying Manuscript Theme to Build Location (ignoring scss/css)...\n")

        await fse.copy(themeSrcDir, themeDestDir, {
            filter: (src) => {
                // If there is a theme/css directory, include it
                if (fs.lstatSync(src).isDirectory()) {
                    return true;
                }

                // But ignore files in the theme/css/ directory
                const relativePath = path.relative(themeSrcDir, src);
                return !relativePath.startsWith('css');
            },
        });

        // Compile SCSS to CSS
        // --------------------
        const scssInput = path.join(manuscriptDir, 'theme', 'css', `styles.${outputType}.scss`);
        const cssOutput = path.join(outputDir, 'theme', 'css', `styles.${outputType}.css`);

        await compileSCSSToCSS(scssInput, cssOutput);

        console.log("-------------------\nYay! All Finished!!\n-------------------\n");
    } catch (error) {
        console.error(chalk.red('\nError Converting Manuscript:'), chalk.red(error));
    }
}
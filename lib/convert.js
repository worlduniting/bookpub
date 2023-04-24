import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import lintEjs from './lint-ejs.js';
import renderEjs from './render-ejs.js';
import parseSmarty from './parse-smartypants.js';
import { compileSCSSToCSS } from './compile-scss.js';
import chalk from 'chalk';
import parseMyst from './parse-myst.js';

// Convert Manuscript Pipeline
//--------------------
// CONVERT MANUSCRIPT INTO BUILD TYPE
//--------------------
export default async function convert(manuscriptDir, outputDir, outputType) {
    try {

        // Load Book Config Options
        // --------------------
        let book;
        try {
            book = yaml.load(fs.readFileSync(path.join(manuscriptDir, '../book.config.yml'), 'utf8'));
        } catch (error) {
            console.error(chalk.red('Error Loading book.config.yml:'), chalk.red(error));
        }

        // Conversion Constants
        // --------------------

        // Book Manuscript Entry File/Path
        const entryFile = book.settings.entryfile;
        const entryPath = path.join(manuscriptDir, entryFile);
        const outputFile = path.join(outputDir, 'index.html');

        // Create Output Directory (if it doesn't exist)
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log('Loading manuscript...\n');
        const manuscript = fs.readFileSync(entryPath, 'utf8');

        // Lint the EJS Content (Check for Errors)
        // --------------------
        let lintedEjs;
        try {
            lintedEjs = await lintEjs(manuscript, ejsLintOpt);
            console.log(chalk.green('Your EJS syntax look great!'));
        } catch (error) {
            console.error(chalk.red('Whoops. We found errors in your EJS syntax:'), chalk.red(error));
        }

        // Render EJS Content
        // --------------------
        let processedEJS;
        try {
            processedEJS = await renderEjs(lintedEjs, book, outputType, manuscriptDir, path);
            console.log(chalk.green('Nice! Your EJS was rendered successfully!'))
        } catch (error) {
            console.error(chalk.red('Dang. We couldn\'t render your EJS:'), chalk.red(error));
        }

        let parsedMyST;
        const mystOptions = book['myst-options'];
        try {
            console.log("\nProcessing MyST Markdown...\n");
            parsedMyST = await parseMyST(processedEJS, mystOptions, outputType);
        } catch (error) {
            console.error(chalk.red('MyST Processing Error:'), chalk.red(error));
        }


        // Use Smartypants to process quotes and symbols
        // --------------------
        let parsedSmarty;
        try {
            console.log("\nConverting quotes and symbols...\n");
            parsedSmarty = await parseSmarty(processedEJS);
        } catch (error) {
            console.error(chalk.red('Smartypants Processing Error:'), chalk.red(error));
        }


        // Write Final Build Output
        // --------------------
        console.log("Writing final build to " + outputFile)
        fs.writeFileSync(outputFile, parsedSmarty);

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
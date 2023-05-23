import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import renderEjs from './render-ejs.js';
import parseSmarty from './parse-smartypants.js';
import compileSASS from './compile-scss.js';
import chalk from 'chalk';
import renderMyst from './render-myst.js';

// CONVERT MANUSCRIPT INTO BUILD TYPE esekere erekese
//--------------------
export default async function convert(book, manuscriptDir, outputType, outputDir, isTest) {
    try {

        // Conversion Constants
        // --------------------


        // Book Manuscript Entry File/Path
        const entryFile = book.settings.entryfile;
        const entryPath = path.join(manuscriptDir, entryFile);
        const outputFile = path.join(outputDir, 'index.html');
        const markdownEngine = book.settings.markdown.engine;

        // Create Output Directory (if it doesn't exist)
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }


        console.log('  * Loading your manuscript\n');
        const manuscript = fs.readFileSync(entryPath, 'utf8');


        // Render EJS Content
        // --------------------
        let processedEJS;
        try {
            console.log('  * Processing your EJS files\n')
            processedEJS = await renderEjs(manuscript, book, outputType, manuscriptDir);
            if (!processedEJS) {
                console.warn(chalk.yellow('     Warning: Your \'processedEJS\' variable is empty or undefined.\n      This means something isn\'t working in the EJS conversion process.\n'));
            }
        } catch (error) {
            console.error(chalk.redBright('Dang. We couldn\'t render your EJS:'), chalk.redBright(error));
        };


        // Convert Markdown to HTML via GFM or MyST
        // --------------------
        let parsedMarkdown;
        if (markdownEngine === 'gfm') {
            try {
                console.log("  * Converting your manuscript Markdown into HTML\n");
                parsedMarkdown = unified()
                    // convert markdown to a MD-AST syntax tree
                    .use(remarkParse)
                    // convert md-ast to gfm-ast (Github Flavored Markdown) and pass options
                    .use(remarkGfm, book['gfm-options'])
                    // convert gfm-ast to html-ast
                    // but don't git rid of none-markdown syntax
                    .use(remarkHtml, { sanitize: false })
                    .processSync(processedEJS)
                    // convert to a string
                    .toString();
            } catch (error) {
                console.error(chalk.redBright('Markdown Processing Error:'), chalk.redBright(error));
            }
        }
        else if (markdownEngine === 'myst') {
            try {
                console.log("  * Converting your manuscript Markdown into HTML\n");
                parsedMarkdown = renderMyst(processedEJS, book, outputType, manuscriptDir);
            } catch (error) {
                console.error(chalk.redBright('Markdown Processing Error:'), chalk.redBright(error));
            }
        };


        // Use Smartypants to process quotes and symbols
        // --------------------
        let parsedSmarty;
        try {
            console.log("  * Converting quotes and symbols\n");
            parsedSmarty = await parseSmarty(parsedMarkdown);
            if (!parsedSmarty) {
                console.warn(chalk.yellow('      Warning: Your \'parsedSmarty\' variable is empty or undefined.\n      This means something isn\'t working in the conversion of your quotes and symbols.\n'));
            }
        } catch (error) {
            console.error(chalk.redBright('Smartypants Processing Error:'), chalk.redBright(error));
        }



        // Write Final Build Output
        // --------------------
        const relOutFile = path.relative(process.cwd(), outputFile);
        console.log(`  * Writing final build to ${chalk.yellowBright(`/${relOutFile}`)}\n`)
        fs.writeFileSync(outputFile, parsedSmarty);


        // Copy Manuscript Theme to Build Location
        // --------------------
        const themeSrcDir = path.join(manuscriptDir, 'theme');
        const themeDestDir = path.join(outputDir, 'theme');
        const relTheme = path.relative(process.cwd(), themeDestDir);
        console.log(`  * Copying Manuscript Theme to ${chalk.yellowBright(`/${relTheme}/`)}\n`)

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
        const scssInputFilename = isTest ? `styles.${outputType}.mock.scss` : `styles.${outputType}.scss`;
        const scssInput = path.join(manuscriptDir, 'theme', 'css', scssInputFilename);
        const cssOutputFilename = isTest ? `styles.${outputType}.mock.css` : `styles.${outputType}.css`;
        const cssOutput = path.join(outputDir, 'theme', 'css', cssOutputFilename);

        const relCssOut = path.relative(process.cwd(), cssOutput);
        console.log(`  * Compiling SASS file: ${chalk.yellowBright(scssInputFilename)} \n       |\n       |=> Creating CSS at ${chalk.yellowBright(`/${relCssOut}`)}\n`)

        await compileSASS(scssInput, cssOutput);

    } catch (error) {
        console.error(chalk.redBright('\nError Converting Manuscript:'), chalk.redBright(error));
    }
}

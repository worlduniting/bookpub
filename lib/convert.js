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

// CONVERT MANUSCRIPT INTO BUILD TYPE esekere erekese
//--------------------
export default async function convert(book, manuscriptDir, outputType, outputDir, isTest) {
    try {

        // Conversion Constants
        // --------------------
        console.log('book in convert is: ', book)

        // Book Manuscript Entry File/Path
        const entryFile = book.settings.entryfile;
        console.log('entryFile in convert is: ', entryFile);
        const entryPath = path.join(manuscriptDir, entryFile);
        const outputFile = path.join(outputDir, 'index.html');

        // Create Output Directory (if it doesn't exist)
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log('  2. Loading your manuscript...\n');
        const manuscript = fs.readFileSync(entryPath, 'utf8');

        // Render EJS Content
        // --------------------
        let processedEJS;
        try {
            console.log('  4. Processing your EJS files...\n')
            processedEJS = await renderEjs(manuscript, book, outputType, manuscriptDir);
            if (!processedEJS) {
                console.warn(chalk.yellow('     Warning: Your \'processedEJS\' variable is empty or undefined.\n      This means something isn\'t working in the EJS conversion process.\n'));
            }
        } catch (error) {
            console.error(chalk.redBright('Dang. We couldn\'t render your EJS:'), chalk.redBright(error));
        };

        // Convert Markdown to HTML
        // --------------------
        let parsedMarkdown;
        try {
            console.log("  5. Converting your manuscript Markdown into HTML...\n");
            parsedMarkdown = unified()
                // convert markdown to a MD-AST syntax tree
                .use(remarkParse)
                // remove indentation before processing
                .use(removeIndentation)
                // convert md-ast to gfm-ast (Github Flavored Markdown) and pass options
                .use(remarkGfm, book['gfm-options'])
                // convert gfm-ast to html-ast
                // but don't git rid of none-markdown syntax
                .use(remarkHtml, { sanitize: false })
                .processSync(processedEJS)
                // convert to a string
                .toString();
            if (!parsedMarkdown) {
                console.warn(chalk.yellow('     Warning: Your parsedMarkdown variable is empty or undefined.\n       This means something isn\'t working in the Markdown conversion funciton.\n'));
            }
        } catch (error) {
            console.error(chalk.redBright('Markdown Processing Error:'), chalk.redBright(error));
        }

        // Use Smartypants to process quotes and symbols
        // --------------------
        let parsedSmarty;
        try {
            console.log("  6. Converting quotes and symbols...\n");
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
        console.log(`  7. Writing final build to ${chalk.yellowBright(`/${relOutFile}`)}\n`)
        fs.writeFileSync(outputFile, parsedSmarty);

        // Copy Manuscript Theme to Build Location
        // --------------------
        const themeSrcDir = path.join(manuscriptDir, 'theme');
        const themeDestDir = path.join(outputDir, 'theme');
        const relTheme = path.relative(process.cwd(), themeDestDir);
        console.log(`  8. Copying Manuscript Theme to ${chalk.yellowBright(`/${relTheme}/`)}\n`)

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
        const scssInputFilename = isTest ? `styles.${outputType}.mock.scss` : `styles.${outputType}.css`;
        const scssInput = path.join(manuscriptDir, 'theme', 'css', scssInputFilename);
        const cssOutputFilename = isTest ? `styles.${outputType}.mock.css` : `styles.${outputType}.css`;
        const cssOutput = path.join(outputDir, 'theme', 'css', cssOutputFilename);

        const relCssOut = path.relative(process.cwd(), cssOutput);
        console.log(`  9. Compiling SASS and Copying to ${chalk.yellowBright(`/${relCssOut}`)}\n`)
        await compileSASS(scssInput, cssOutput);

    } catch (error) {
        console.error(chalk.redBright('\nError Converting Manuscript:'), chalk.redBright(error));
    }
}

function removeIndentation() {
    try {
        return (tree) => {
            tree.children = tree.children.map((node) => {
                if (node.type === 'paragraph') {
                    node.children = node.children.map((textNode) => {
                        if (textNode.type === 'text') {
                            textNode.value = textNode.value.replace(/(^\s+)/gm, '');
                        }
                        return textNode;
                    });
                }
                return node;
            });
        };
    } catch (error) {
        console.error(chalk.redBright('\nThere was a problem when we tried to remove indentations in your manuscript:'), chalk.redBright(error));
    }
}

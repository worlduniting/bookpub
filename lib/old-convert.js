import fs from 'fs';
import ejs from 'ejs';
import fse from 'fs-extra';
import path from 'path';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkHtml from 'remark-html';
import yaml from 'js-yaml';
import sass from 'sass';
import ejslint from 'ejs-lint'

// Small hack to import commonJS Smartypants into our ES Module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const SmartyPants = require('smartypants');

// Convert markdown and source files in /manuscript into
// one .html file in build/html
export default async function convert(manuscriptDir, outputDir, outputType) {
    try {

        // Define outputFile within the convert function
        const outputFile = path.join(outputDir, 'index.html');

        // Set initial run variable to false (will be assigned true if already run)
        let hasRun = false;

        // Make sure this only gets called once per build
        if (hasRun) {
            return;
        }
        hasRun = true;
        // Create the output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Load and log the book.yml file
        console.log("Loading book.config.yml...\n");
        const book = yaml.load(fs.readFileSync(path.join(manuscriptDir, '../book.config.yml'), 'utf8'));

        // Load the files listed
        const entryFile = book.settings.entryfile;
        const tocfile = path.join(manuscriptDir, 'frontmatter/toc.html.ejs');

        // Read the contents of each file and concatenate them into one markdown document
        console.log(`Loading manuscript source files...\n`);
        const templatePath = path.join(manuscriptDir, entryFile);
        const templateContent = fs.readFileSync(templatePath, 'utf8');

        console.log("Linting toc");
        try {
            ejslint(tocfile);
        } catch (err) {
            console.error('EJS Lint Error:', err.message)
        }

        // Lint (Check for errors) the ejs content
        console.log('Checking EJS files for errors...')
        const lintedEjs = templateContent;
        try {
            ejslint(lintedEjs);
        } catch (err) {
            console.error('EJS Lint Error:', err.message)
        }

        // Render the EJS template with the book data and processed HTML content
        const processedEJS = ejs.render(templateContent, {
            meta: book.meta,
            outputType: outputType,
            manuscriptDir: manuscriptDir,
            path: path,
        }, { views: [manuscriptDir] });

        // Convert the markdown document to HTML using Unified Remark
        console.log("Converting manuscript Markdown files into HTML...\n");
        const html = unified()
            // convert markdown to a MD-AST syntax tree
            .use(remarkParse)
            // convert md-ast to gfm-ast (Github Flavored Markdown) and pass options
            .use(remarkGfm, book['gfm-options'])
            // convert md-ast into directive-ast
            // allows plugin creation for custom directives
            .use(remarkDirective)
            // convert gfm-ast to html-ast
            // but don't git rid of none-markdown syntax
            .use(remarkHtml, { sanitize: false })
            .processSync(processedEJS)
            // convert to a string
            .toString();

        // Use Smartypants to process symbols and quotes
        console.log("Converting symbols to smart symbols with \"smartypants\"...\n");
        const smartHtml = SmartyPants.default(html)

        // Write final output to output file (build/html/index.html)
        fs.writeFileSync(outputFile, smartHtml);

        // Copy the contents of the "./manuscript/theme" directory into the "./build/html" directory
        const themeSrcDir = path.join(manuscriptDir, 'theme');
        const themeDestDir = path.join(outputDir, 'theme');

        console.log("Copying theme into build folder, but ignoring styles..css...\n");
        // Copy the theme/css directory, but not its contents
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
        console.log(`Loading the input scss file path with ${outputType}...\n`);
        const scssInput = path.join(manuscriptDir, 'theme', 'css', `styles.${outputType}.scss`);

        console.log(`Loading the output css file path with ${outputType}...\n`);
        const cssOutput = path.join(outputDir, 'theme', 'css', `styles.${outputType}.css`);

        try {
            const result = sass.renderSync({ file: scssInput, outputStyle: 'compressed' });
            fs.writeFileSync(cssOutput, result.css);
        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', `Error compiling SCSS: ${error.message}`);
        }

        console.log("All Finished!\n")
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `Error Converting Source Files: ${error.message}`);
    }
}
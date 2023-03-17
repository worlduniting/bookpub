import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkHtml from 'remark-html';
import includerjs from '@worlduniting/includerjs';
import yaml from 'js-yaml'; import { visit } from 'unist-util-visit'
import { h } from 'hastscript'

// Define __dirname for ES module - so we can use it like CommonJS
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Set the locations for manuscript source and builds
const manuscriptDir = path.join(__dirname, '../manuscript');
const outputDir = path.join(__dirname, '../build', 'html');
const outputFile = path.join(outputDir, 'index.html');

// Copy the contents of the "./manuscript/theme" directory into the "./build/html" directory
const themeSrcDir = path.join(__dirname, '../manuscript/theme');
const themeDestDir = path.join(__dirname, '../build/html/theme');
console.log("Copying theme into build folder...\n");
await fse.copy(themeSrcDir, themeDestDir);


// Convert all Markdown files in /manuscript into one .html file
export default async function convert() {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    console.log("Loading book.yaml...\n");
    // Load the book.yaml files
    const book = yaml.load(fs.readFileSync('./book.yaml', 'utf8'));

    // Load the files listed
    const files = book.files;

    // Read the contents of each file and concatenate them into one markdown document
    console.log("Loading markdown files...\n")
    const markdownDocument = files
        .map(file => fs.readFileSync(path.join(manuscriptDir, file), 'utf8'))
        .join('\n\n');

    // Process @include statements using the includer module
    console.log("Processing @include files")
    const processedMarkdown = includerjs(markdownDocument, { basePath: manuscriptDir });
    // Convert the markdown document to HTML using Remark
    console.log("Converting manuscript Markdown fiels into HTML...\n")
    const html = unified()
        // convert markdown to a MD-AST syntax tree
        .use(remarkParse)
        // convert md-ast to gfm-ast
        .use(remarkGfm)
        // convert md-ast into directive-ast
        // using the plugin function below
        .use(remarkDirective)
        .use(myRemarkPlugin)
        // convert gfm-ast to html-ast
        // but don't git rid of none-markdown syntax
        .use(remarkHtml, { sanitize: false, handlers: {} })
        .processSync(processedMarkdown)
        .toString();

    // Write the HTML output to the output file
    console.log(`Writing new HTML file ${outputFile}...\n`)
    fs.writeFileSync(outputFile, html);

    console.log("All Finished!\n")
}

convert().catch((error) => {
    console.error(error);
});

// This plugin is an example to let users write HTML with directives.
// It’s informative but rather useless.
// See below for others examples.
/** @type {import('unified').Plugin<[], import('mdast').Root>} */
function myRemarkPlugin() {
    return (tree) => {
        visit(tree, (node) => {
            if (
                node.type === 'textDirective' ||
                node.type === 'leafDirective' ||
                node.type === 'containerDirective'
            ) {
                const data = node.data || (node.data = {})
                const hast = h(node.name, node.attributes)

                data.hName = hast.tagName
                data.hProperties = hast.properties
            }
        })
    }
}

import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import includerjs from '@worlduniting/includerjs';
import yaml from 'js-yaml';
import { loadPlugins } from './directivePlugins.mjs'

// Define __dirname for ES module - so we can use it like CommonJS
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Set the locations for manuscript source and builds
const manuscriptDir = path.join(__dirname, '../manuscript');
const outputDir = path.join(__dirname, '../build', 'html');
const outputFile = path.join(outputDir, 'index.html');

// Convert all Markdown files in /manuscript into one .html file
export default async function convert() {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load the book.yaml files
    const book = yaml.load(fs.readFileSync('./book.yaml', 'utf8'));

    // Load the files listed
    const files = book.files;

    // Read the contents of each file and concatenate them into one markdown document
    const markdownDocument = files
        .map(file => fs.readFileSync(path.join(manuscriptDir, file), 'utf8'))
        .join('\n\n');

    // Process @include statements using the includer module
    const processedMarkdown = includerjs(markdownDocument, { basePath: manuscriptDir });
    // Load all directive plugins from plugins folder
    const plugins = await loadPlugins();

    // Convert the markdown document to HTML using Remark
    const html = unified()
        // convert markdown to a MD-AST syntax tree
        .use(remarkParse)
        // convert md-ast to gfm-ast
        .use(remarkGfm)
        // convert md-ast into directive-ast
        // using the plugin function below
        .use(remarkDirective)
        // convert gfm-ast to html-ast
        // but don't git rid of none-markdown syntax
        .use(remarkHtml, { sanitize: false, handlers: { root: rootHandler } })
        // plugins for remark-directive
        .use(...plugins)
        .processSync(processedMarkdown)
        .toString();

    // Write the HTML output to the output file
    fs.writeFileSync(outputFile, html);

    console.log(`HTML file written to ${outputFile}`);
}

function rootHandler(h, node) {
    const children = node.children.map((child) => h(child.position, child));
    return children;
}

convert().catch((error) => {
    console.error(error);
});

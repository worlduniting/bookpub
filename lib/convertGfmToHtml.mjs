import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';
import yaml from 'js-yaml';

// Define __dirname for ES module - so we can use it like CommonJS
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Set the locations for manuscript source and builds
const manuscriptDir = path.join(__dirname, '../manuscript');
const outputDir = path.join(__dirname, '../build', 'html');
const outputFile = path.join(outputDir, 'index.html');

// Convert all Markdown files in /manuscript into one .html file
export default function convertGfmToHtml() {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Load the book.yaml files
    const book = yaml.load(fs.readFileSync('./book.yaml', 'utf8'));
    // Load the files listed under the files item
    const files = book.files;

    // Read the contents of each file and concatenate them into one markdown document
    const markdownDocument = files
        .map(file => fs.readFileSync(path.join(manuscriptDir, file), 'utf8'))
        .join('\n\n');
    // Convert the markdown document to HTML using Remark
    const html = unified()
        // convert markdown to a MD-AST syntax tree
        .use(remarkParse)
        // convert md-ast to gfm-ast
        .use(remarkGfm)
        // convert gfm-ast to html-ast
        // but don't git rid of none-markdown syntax (sanitize)
        .use(remarkHtml, { sanitize: false, handlers: {} })
        .processSync(markdownDocument)
        .toString();
    // Write the HTML output to the output file
    fs.writeFileSync(outputFile, html);

    console.log(`HTML file written to ${outputFile}`);
}
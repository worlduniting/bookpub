import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import markdown from 'remark-parse';
import stringify from 'remark-stringify';
import frontmatter from 'remark-frontmatter';
import gfm from 'remark-gfm';
import remark2rehype from 'remark-rehype';
import rehype2html from 'rehype-stringify';
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
        .use(markdown)
        .use(gfm)
        .use(frontmatter)
        .use(remark2rehype)
        .use(stringify)
        .use(rehype2html)
        .processSync(markdownDocument)
        .toString();
    // Write the HTML output to the output file
    fs.writeFileSync(outputFile, html);

    console.log(`HTML file written to ${outputFile}`);
}
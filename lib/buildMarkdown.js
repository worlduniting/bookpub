const fs = require('fs');
const path = require('path');
const unified = require('unified');
const markdown = require('remark-parse');
const html = require('rehype-stringify');
const remark2rehype = require('remark-rehype');
const toc = require('remark-toc');
const frontmatter = require('remark-frontmatter');

const markdownFiles = [
    // List your markdown files here in the order you want them to be combined
    'file1.md',
    'file2.md',
    'file3.md',
];

const outputFilename = 'final.md';

const processor = unified()
    .use(markdown)
    .use(frontmatter)
    .use(toc)
    .use(remark2rehype)
    .use(html);

function readMarkdownFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

async function concatenateMarkdownFiles(files) {
    let finalMarkdown = '';
    for (const file of files) {
        const content = await readMarkdownFile(file);
        finalMarkdown += content + '\n\n';
    }
    return finalMarkdown;
}

async function generateTableOfContents(markdownContent) {
    const { contents } = await processor.process(markdownContent);
    return contents;
}

async function writeFile(filename, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, content, 'utf-8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function main() {
    const concatenatedMarkdown = await concatenateMarkdownFiles(markdownFiles);
    const tableOfContents = await generateTableOfContents(concatenatedMarkdown);
    const finalMarkdown = `# Table of Contents\n\n${tableOfContents}\n\n${concatenatedMarkdown}`;

    await writeFile(outputFilename, finalMarkdown);
    console.log(`Combined markdown file with table of contents saved as ${outputFilename}`);
}

main().catch((error) => {
    console.error('Error:', error);
});

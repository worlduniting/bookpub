import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkToc from 'remark-toc';
import remarkSlug from 'remark-slug';
import remarkStringify from 'remark-stringify';
import fs from 'fs';
import path from 'path';

const manuscriptDir = path.dirname(new URL(import.meta.url).pathname);

export async function generateToc(markdownDocument) {
    const tocMarkdown = unified()
        .use(remarkParse)
        .use(remarkSlug) // Add unique slugs (URL-friendly ids) to heading elements
        .use(remarkToc) // Generate the TOC from the headings
        .use(remarkStringify) // Convert the MD-AST back to a Markdown string
        .processSync(markdownDocument)
        .toString();

    // Save the table of contents to a separate toc.md file
    fs.writeFileSync(path.join(manuscriptDir, '../manuscript/frontmatter/toc.md'), tocMarkdown);
    return 'toc.md';
}

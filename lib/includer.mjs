import fs from 'fs';
import path from 'path';

const includeRegex = /^@include\s+(.*)$/;

export default function includer(input, options = {}) {
    const basePath = options.basePath || '';
    const lines = input.split('\n');
    const output = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(includeRegex);

        if (match) {
            const file = match[1];
            const fullPath = path.resolve(basePath, file);
            const contents = fs.readFileSync(fullPath, 'utf-8');
            const nestedIncludedContents = includer(contents, { basePath: path.dirname(fullPath) });
            const includedLines = nestedIncludedContents.split('\n');
            output.push(...includedLines);
        } else {
            output.push(line);
        }
    }

    return output.join('\n');
}

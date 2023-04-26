import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const myst = require('mystjs');

export default async function parseMyST(content, options, outputType) {
    try {
        console.log('Parsing MyST Markdown Content...')
        const parsedMyST = await myst.parse(content, options, outputType);
        return parsedMyst;
    } catch (error) {
        console.error(chalk.red('Error Parsing MyST Markdown:'), chalk.red(error));
    }
}

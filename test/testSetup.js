import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import cliui from 'cliui';
import chalk from 'chalk';
import { after } from 'mocha';
import archiveAndClean from './archiveClean.js';


// Calculate __dirname and __filename here
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// isTest is passed as a boolean to indicate to modules if they are being run in a test context. (used as test-conditional in modules)
export const setup = (isTest = false) => {
    const manuscriptDir = path.join(__dirname, 'mocks/manuscript');
    const bookLocation = path.join(__dirname, 'mocks/book.config.mock.yml');

    // Output test manuscript directory and book settings
    const uiDirs = cliui({ wrap: false });
    uiDirs.div(
        { text: chalk.yellowBright(`Using test manuscript directory: ${chalk.white(path.relative(process.cwd(), manuscriptDir))}`), padding: [0, 0, 0, 5] }
    )
    console.log(uiDirs.toString());


    // Load the book.config.yml into the book object
    const book = yaml.load(fs.readFileSync(bookLocation, 'utf8'));

    // Log book settings to the console
    const uiBook = cliui({ wrap: false });
    uiBook.div(
        { text: chalk.yellowBright(`Using test book settings from ${chalk.white(path.relative(process.cwd(), bookLocation))}\n`), padding: [0, 2, 0, 5] }
    )
    uiBook.div(
        { text: JSON.stringify(book, null, 2), padding: [0, 10, 0, 5] }
    )
    console.log(uiBook.toString());

    // Export variables for use in tests
    return { __dirname, book, manuscriptDir, isTest };
};

// Add this block
after(async () => {
    const buildDir = path.resolve(__dirname, 'build');
    const archiveDir = path.resolve(__dirname, 'archives');

    await archiveAndClean(buildDir, archiveDir);
});

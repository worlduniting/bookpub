import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

// isTest is passed as a boolean to indicate to modules if they are being run in a test context. (used as test-conditional in modules)
export const setup = (isTest = false) => {
    // Calculate __dirname and __filename here
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const manuscriptDir = path.join(__dirname, 'mocks/manuscript');
    const bookLocation = path.join(__dirname, 'mocks/book.config.mock.yml');

    // Load the book.config.yml into the book object
    const book = yaml.load(fs.readFileSync(bookLocation, 'utf8'));
    console.log('book', book)
    // Export variables for use in tests
    return { __dirname, book, manuscriptDir, isTest };
};

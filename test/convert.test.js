import { expect } from 'chai';
import { setup } from './testSetup.js';
import convert from '../lib/convert.js';
import path from 'path';
import { promises as fsPromises } from 'fs';

describe('convert()', () => {
    // Import variables from the setup
    const { __dirname, book, manuscriptDir, isTest } = setup(true);
    console.log('book', book)

    console.log(`__dirname: ${__dirname}\n\n manuscriptDir: ${manuscriptDir}`);

    it('should create the html output directory and index.html file', async () => {
        const outputType = 'html';
        const outputDir = path.join(__dirname, 'build', outputType);

        await convert(book, manuscriptDir, outputType, outputDir, isTest);

        const outputPath = path.join(outputDir, 'index.html');
        console.log('outputPath', outputPath);
        const outputFileExists = await fsPromises.stat(outputPath).then(() => true).catch(() => false);
        expect(outputFileExists).to.be.true;

        // Clean up the created output directory after the test
        await fsPromises.rm(outputDir, { recursive: true, force: true });
    });
});

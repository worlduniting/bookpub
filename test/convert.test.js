import { expect } from 'chai';
import { setup } from './testSetup.js';
import convert from '../lib/convert.js';
import path from 'path';
import { promises as fsPromises } from 'fs';
import chalk from 'chalk';

describe(chalk.cyanBright('BookPub should convert manuscript into the correct format type\n\n'), () => {
    // Import variables from the setup
    const { __dirname, book, manuscriptDir, isTest } = setup(true);

    // Suppress convert.js console output
    const consoleLog = console.log;
    before(() => {
        console.log = () => {};
    });
    after(() => {
        console.log = consoleLog;
    });


    it('should create the html output directory and index.html file\n\n', async () => {
        const outputType = 'html';
        const outputDir = path.join(__dirname, 'build', outputType);

        await convert(book, manuscriptDir, outputType, outputDir, isTest);

        const outputPath = path.join(outputDir, 'index.html');
        const outputFileExists = await fsPromises.stat(outputPath).then(() => true).catch(() => false);
        expect(outputFileExists).to.be.true;
    });

    it('should create the pdf output directory and index.html file\n        (This will be used to build the PDF)\n', async () => {
        const outputType = 'pdf';
        const outputDir = path.join(__dirname, 'build', outputType);

        console.log(chalk.yellowBright(`Checking for ${chalk.white('index.html')} in test output directory:\n      ${chalk.white(outputDir)}`));

        await convert(book, manuscriptDir, outputType, outputDir, isTest);

        const outputHtmlPath = path.join(outputDir, 'index.html');
        const outputHtmlFileExists = await fsPromises.stat(outputHtmlPath).then(() => true).catch(() => false);
        expect(outputHtmlFileExists).to.be.true;
    });


//----------
// Implement once npm prince package integrated
/*

    it('should create the pdf output directory and pdf file', async () => {
        const outputType = 'pdf';
        const outputDir = path.join(__dirname, 'build', outputType);

        await convert(book, manuscriptDir, outputType, outputDir, isTest);

        // Check that the pdf file exists
        console.log('Checking for pdf file');
        const outputPdfPath = path.join(outputDir, 'index.pdf');
        const outputPdfFileExists = await fsPromises.stat(outputPdfPath).then(() => true).catch(() => false);
        expect(outputPdfFileExists).to.be.true;

        // Clean up the created output directory after the test
        await fsPromises.rm(outputDir, { recursive: true, force: true });
    });
*/

});

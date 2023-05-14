import { assert } from 'chai';
import { setup } from './testSetup.js';
import lintEjs from '../lib/lint-ejs.js';
import path from 'path';

describe('Lint test', function () {
    const { manuscriptDir, book } = setup(); // Import manuscriptDir from the setup

    it('should lint one file and show file name', async function () {
        const fileName = 'ejs-error.md.mock.ejs';
        const filePath = path.join(manuscriptDir, fileName);

        // Capture console.error output
        let stdout = '';
        const originalConsoleError = console.error;
        console.error = (message) => {
            stdout += message;
        };
        try {
            // Test lintEjsFile(filePath) function
            await lintEjs(filePath);

            const expectedFileName = path.join(fileName);
            const expectedMsgOne = `Linting EJS file:`;
            const expectedTag = '<^ badTestTag %>';

            assert.include(stdout, expectedMsgOne, 'Output should include \'Linting EJS file\'');
            assert.include(stdout, expectedFileName, 'Output should include the file name');
            assert.include(stdout, expectedTag, 'Output should include the faulty tag');
        } catch (error) {
            // Handle any error that occurred during linting
            console.error(error);
            assert.fail('Linting test for messaging failed');
        }
    });

    it('should lint one file and faulty tag', async function () {
        const fileName = 'ejs-error.md.mock.ejs';
        const filePath = path.join(manuscriptDir, fileName);

        // Capture console.error output
        let stdout = '';
        const originalConsoleError = console.error;
        console.error = (message) => {
            stdout += message;
        };
        try {
            // Test lintEjsFile(filePath) function
            await lintEjs(filePath);
            console.log(stdout);

            const expectedTag = '<^ badTestTag %>';

            assert.include(stdout, expectedTag, 'Output should include the faulty tag');
        } catch (error) {
            // Handle any error that occurred during linting
            console.error(error);
            assert.fail('Linting test for showing tag failed');
        }
    });
});

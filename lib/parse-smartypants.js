import { createRequire } from 'module';

// Small hack to use this CJS module in our ESM module
const require = createRequire(import.meta.url);
const parsingSmarty = require('smartypants');

export default async function parseSmarty(processedEJS) {
    return new Promise((resolve) => {
        try {
            const parsedSmarty = parsingSmarty.default(processedEJS);
            resolve(parsedSmarty);
        } catch (error) {
            console.error('Error parsing Smartypants:', error);
            resolve(processedEJS);
        }
    });
}

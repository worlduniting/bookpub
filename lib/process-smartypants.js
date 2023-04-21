import { createRequire } from 'module';

// Small hack to use this CJS module in our ESM module
const require = createRequire(import.meta.url);
const SmartyPants = require('smartypants');

export default async function processSmartpants(processedEJS) {
    return new Promise((resolve) => {
        try {
            const smartHtml = SmartyPants.default(processedEJS);
            resolve(smartHtml);
        } catch (error) {
            console.error('Error processing Smartypants:', error);
            resolve(processedEJS); // Return the original content if Smartypants processing fails
        }
    });
}

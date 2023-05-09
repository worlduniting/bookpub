import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
    // Set the outputType with 'env' variable or default to html
    const outputType = env.outputType || 'html';

    return {
        watch: ['manuscript', 'book.config.yml'],
        ext: 'md,mdx,js,ejs,json,html,css,scss,yml,yaml',
        ignore: [
            'node_modules',
            'build/**/*'
        ],
        exec: `bookshop build -t ${outputType}`
    };
};
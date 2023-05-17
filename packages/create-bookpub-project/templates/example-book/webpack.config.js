import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
    // Set the outputType with 'env' variable or default to html
    const outputType = env.outputType || 'html';
    // Check if 'env' is pdf, otherwise default to html
    const outputPath = outputType === 'pdf' ? 'build/pdf' : 'build/html';
    const entryName = path.join(__dirname, 'build', outputType, 'theme', 'js', 'index.js');

    return {
        mode: 'development',
        entry: {
            main: path.resolve(entryName),
        },
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, outputPath),
        },
        devServer: {
            static: {
                directory: path.join(__dirname, outputPath),
            },
            port: 3000,
            open: true,
        },
        ignoreWarnings: [/^.*(?=module).*$/],
        stats: {
            // Which output sections to show
            chunks: false,
            colors: true,
            modules: false,
            hash: false,
            version: false,
            timings: false,
            children: false,
            chunkModules: false
        },
        experiments: {
            topLevelAwait: true,
        },
        resolve: {
            fallback: {
                path: false,
                util: false,
                assert: false,
                stream: false,
                constants: false,
                fs: false,
            },
        },
        plugins: [
            // ... other plugins ...
            new MessageTag({ message: `\n    ===|  To Quit Dev Mode use ctrl-c (twice to force) |===\n\n` }),
        ],
    };
};

class MessageTag {
    constructor(options) {
        this.message = options.message || 'To Quit Dev Mode use ctrl-c (twice to force)';
    }

    apply(compiler) {
        compiler.hooks.done.tap('MessageTag', (stats) => {
            console.log('\n' + this.message);
        });
    }
}
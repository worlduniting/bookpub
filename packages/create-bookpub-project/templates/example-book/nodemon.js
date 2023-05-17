// Export a JSON object with for Nodemon
export default (env) => {
    // Set the outputType with 'env' variable or default to html
    const outputType = env.outputType || 'html';
    // Set the bookpubPath with 'env' variable or default to 'bookpub'
    const bookpubPath = env.bookpubPath || 'bookpub';

    return {
        watch: ['manuscript', 'book.config.yml'],
        ext: 'md,mdx,js,ejs,json,html,css,scss,yml,yaml',
        ignore: [
            'node_modules',
            'build/**/*'
        ],
        exec: `${bookpubPath} build -t ${outputType}`
    };
};
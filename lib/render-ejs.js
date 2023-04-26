import ejs from 'ejs';

export default async function renderEjs(ejsContent, book, outputType, manuscriptDir, path) {
    const processedEJS = ejs.render(ejsContent, {
        meta: book.meta,
        outputType: outputType,
        manuscriptDir: manuscriptDir,
        path: path,
    }, { views: [manuscriptDir] });
    return processedEJS;
}
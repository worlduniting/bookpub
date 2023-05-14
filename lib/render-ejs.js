import ejs from 'ejs';

export default async function renderEjs(ejsContent, book, outputType, manuscriptDir) {
    const data = { ...book, outputType };
    const processedEJS = ejs.render(ejsContent, data, {
        ...book['ejs-options'],
        views: [manuscriptDir]
    });
    return processedEJS;
}
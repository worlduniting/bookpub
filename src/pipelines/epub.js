/** The native EPUB pipeline. Every stage can also be used in a custom pipeline. */
export const epubPipeline = {
  stages: [
    { name: 'ejs' },
    { name: 'markdown' },
    { name: 'themes', config: { styleType: 'epub' } },
    { name: 'epub' },
    { name: 'epubCheck' },
    { name: 'writeEpub' }
  ]
};

/**
 * Default pipelines for common build types
 */
export const defaultPipelines = {
    pdf: [
      { name: 'ejs', config: {} },
      { name: 'markdown', config: {} },
      { name: 'theme', config: {} }
    ],
    epub: [
      { name: 'ejs', config: {} },
      { name: 'markdown', config: {} },
      { name: 'theme', config: {} }
      // Potentially an "epubPack" stage or more
    ]
  };

/**
 * Default pipelines for common build types
 */
export const defaultPipelines = {
    pdf: [
      { name: 'ejs', config: {} },
      { name: 'markdown', config: {} },
      { name: 'theme', config: {} },
      { name: 'writeHtml', config: {} }
    ],
    html: [
      { name: 'ejs', config: {} },
      { name: 'markdown', config: {} },
      { name: 'theme', config: {} },
      { name: 'writeHtml', config: {} }
      // Potentially an "epubPack" stage or more
    ],
    epub: [
      { name: 'ejs', config: {} },
      { name: 'markdown', config: {} },
      { name: 'theme', config: {} },
      { name: 'writeHtml', config: {} }
      // Potentially an "epubPack" stage or more
    ]
  };

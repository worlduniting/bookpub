import { exec } from 'child_process';

/**
 * Markdown Stage:
 *  - Converts markdown => HTML (via Pandoc)
 */
export async function run(manuscript, { stageConfig }) {
  if (!manuscript.content) {
    console.log("No markdown content to convert. Skipping...");
    return manuscript;
  }

  const pandocPath = stageConfig.pandocPath || 'pandoc';

  const convertMarkdownToHTML = (markdown) =>
    new Promise((resolve, reject) => {
      const proc = exec(`${pandocPath} -f markdown -t html5`, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
      });
      proc.stdin.write(markdown);
      proc.stdin.end();
    });

  try {
    const html = await convertMarkdownToHTML(manuscript.content);
    manuscript.content = html;
  } catch (err) {
    console.error("Error with Pandoc:", err);
  }

  return manuscript;
}

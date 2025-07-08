import { exec } from 'child_process';

/**
 * @module markdownStage
 * @description
 * This stage converts Markdown content to HTML using Pandoc.
 *
 * It assumes that `manuscript.content` contains Markdown and uses the Pandoc command-line
 * tool to convert it to HTML. All configuration is expected to be provided via `stageConfig`.
 * Specifically, the Pandoc executable path must be provided in `stageConfig.config.pandocPath`.
 *
 * @param {Object} manuscript - The manuscript object, with a `content` property holding Markdown.
 * @param {Object} context - An object containing configuration for the stage.
 * @param {Object} context.stageConfig - Stage-specific configuration.
 *   @param {Object} context.stageConfig.config - The configuration object.
 *   @param {string} context.stageConfig.config.pandocPath - Path to the Pandoc executable.
 * @returns {Promise<Object>} The updated manuscript object with HTML content.
 *
 * @throws Will throw an error if `pandocPath` is not provided in `stageConfig.config`.
 *
 * @example
 * // Example configuration in book.config.yml:
 * //
 * // global:
 * //   stages:
 * //     - name: markdown
 * //       config:
 * //         pandocPath: "/usr/bin/pandoc"
 * //
 * // buildPipelines:
 * //   html:
 * //     stages:
 * //       - name: markdown
 * //         config: {}  # (No override needed if defined globally)
 */
export async function run(manuscript, { stageConfig }) {
  if (!manuscript.content) {
    console.log("No markdown content to convert. Skipping...");
    return manuscript;
  }

  // Ensure that pandocPath is provided in the nested config.
  if (
    !stageConfig ||
    !stageConfig.config ||
    !stageConfig.config.pandocPath
  ) {
    throw new Error(
      "Pandoc path is required in stage configuration for the markdown stage. " +
      `Please provide it under stages (markdown):
      stages:
        - name: markdown
          config:
            pandocPath: pandocPath
      `
    );
  }
  const pandocPath = stageConfig.config.pandocPath;

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
    throw err;
  }

  return manuscript;
}

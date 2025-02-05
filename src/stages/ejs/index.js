import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

/**
 * @module ejsStage
 * @description
 * This stage processes an EJS template and renders it into Markdown.
 * It looks for the manuscript source file at:
 *   manuscript/index.md.ejs
 * If the file exists, it renders the file using EJS and assigns the output to
 * `manuscript.content`. All options provided via `stageConfig` are passed directly
 * to EJS without any preset defaults.
 *
 * @param {Object} manuscript - The manuscript object.
 * @param {string} manuscript.buildType - The build type (e.g., 'html', 'pdf').
 * @param {Object} context - An object containing configuration objects.
 * @param {Object} context.stageConfig - Stage-specific configuration. For example,
 *                                       it can include properties like `strict`.
 * @param {Object} context.globalConfig - Global configuration. The property `globalConfig.meta`
 *                                        is passed to the template.
 * @returns {Promise<Object>} Returns the updated manuscript object.
 *
 * @example
 * // Example configuration in book.config.yml:
 * //
 * // buildPipelines:
 * //   html:
 * //     stages:
 * //       - name: ejs
 * //         config: {}  # No preset configurations; users can specify options if needed.
 */
export async function run(manuscript, { stageConfig, globalConfig }) {
  // Determine the path to the EJS source file.
  const mainFilePath = path.join(process.cwd(), 'manuscript', 'index.md.ejs');
  if (!fs.existsSync(mainFilePath)) {
    console.log("No index.md.ejs found; skipping EJS stage...");
    return manuscript;
  }

  // Read the EJS template content.
  const templateContent = fs.readFileSync(mainFilePath, 'utf8');

  // Build the options object for EJS without any preset configuration.
  const ejsOptions = { filename: mainFilePath };
  if (stageConfig && stageConfig.strict !== undefined) {
    ejsOptions.strict = stageConfig.strict;
  }

  // Render the EJS template with the provided global meta and buildType.
  const renderedMarkdown = ejs.render(
    templateContent,
    {
      meta: globalConfig.meta,
      buildType: manuscript.buildType
    },
    ejsOptions
  );

  manuscript.content = renderedMarkdown;
  return manuscript;
}

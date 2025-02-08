import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';

/**
 * @module writeHtmlStage
 * @description
 * This stage writes the final HTML content to the output build directory.
 * It assumes that the manuscript object contains the final HTML in `manuscript.content`
 * and the current build type in `manuscript.buildType`.
 *
 * This stage is configuration-free. No stage-specific settings are required, and
 * any provided configuration in `stageConfig` is ignored.
 *
 * The HTML is written to:
 *   build/<buildType>/index.html
 *
 * @param {Object} manuscript - The manuscript object.
 * @param {string} manuscript.buildType - The current build type (e.g., 'html', 'pdf').
 * @param {string} manuscript.content - The final HTML content.
 * @param {Object} context - An object containing configuration.
 * @param {Object} context.stageConfig - Stage-specific configuration (unused).
 * @param {Object} context.globalConfig - Global configuration (unused).
 * @returns {Promise<Object>} Returns the updated manuscript object.
 *
 * @example
 * // In your book.config.yml:
 * //
 * // buildPipelines:
 * //   html:
 * //     stages:
 * //       - name: writeHtml
 * //         config: {}
 */
export async function run(manuscript, { stageConfig, globalConfig }) {
  // Determine the output directory for the current build type.
  const buildDir = path.join(process.cwd(), 'build', manuscript.buildType);

  // Ensure that the build directory exists.
  fse.ensureDirSync(buildDir);

  // Define the output path for the final HTML file.
  const outputPath = path.join(buildDir, 'index.html');

  // Write the final HTML content to the output file.
  fs.writeFileSync(outputPath, manuscript.content, 'utf8');

  console.log(`Wrote final HTML to: ${path.relative(process.cwd(), outputPath)}`);
  return manuscript;
}

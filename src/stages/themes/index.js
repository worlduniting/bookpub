import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import sass from 'sass';

/**
 * @module themesStage
 * @description
 * This stage processes theme assets for the book by copying a user-selected theme
 * from the manuscript themes folder into the build output, with special handling for CSS.
 *
 * Users can choose a theme by specifying its name in the stage configuration:
 *
 * buildPipelines:
 *   html:
 *     stages:
 *       - name: themes
 *         config:
 *           name: "grayscale"
 *
 * If no theme name is provided, the fallback theme "default" is used.
 *
 * All assets in the selected theme folder (located at `/manuscript/themes/[theme]/`)
 * are copied to the build output folder (`build/<buildType>/themes/`), except the entire
 * "css" folder. Instead, only the stylesheet for the current build type is processed:
 *
 * - The source SCSS file is expected at: 
 *     /manuscript/themes/[theme]/css/stylesheet.<buildType>.scss
 * - This file is compiled to CSS using Sass.
 * - The resulting CSS file is written as:
 *     /build/<buildType>/themes/css/stylesheet.<buildType>.css
 * - No other files from the theme’s css folder are copied.
 *
 * @param {Object} manuscript - The manuscript object containing:
 *   @param {string} manuscript.buildType - The current build type (e.g., 'html', 'pdf', etc.).
 * @param {Object} context - An object containing configuration information.
 * @param {Object} context.stageConfig - Stage-specific configuration.
 *   @param {Object} context.stageConfig.config - The configuration object for the stage.
 *   @param {string} [context.stageConfig.config.name] - The name of the theme to use.
 *     If not provided, the fallback theme "default" is used.
 * @returns {Promise<Object>} Returns the updated manuscript object.
 *
 * @throws Will throw an error if the selected theme does not exist or if the required
 *         stylesheet file for the current build type is not found.
 *
 * @example
 * // Example configuration in book.config.yml:
 * //
 * // buildPipelines:
 * //   html:
 * //     stages:
 * //       - name: themes
 * //         config:
 * //           name: "grayscale"
 */
export async function run(manuscript, { stageConfig }) {
  // Determine the theme name; fallback to "default" if not provided.
  const themeName =
    (stageConfig && stageConfig.config && stageConfig.config.name)
      ? stageConfig.config.name
      : 'default';

  // Determine the build type (e.g., html, pdf, etc.)
  const buildType = manuscript.buildType;

  // Define the source directory for the selected theme.
  const themeSourceDir = path.join(process.cwd(), 'manuscript', 'themes', themeName);
  if (!fs.existsSync(themeSourceDir)) {
    throw new Error(`The selected theme "${themeName}" does not exist at ${themeSourceDir}.`);
  }

  // Define the build output directory for the current build type.
  const buildDir = path.join(process.cwd(), 'build', buildType);
  fse.ensureDirSync(buildDir);
  const outputThemeDir = path.join(buildDir, 'themes');
  fse.ensureDirSync(outputThemeDir);

  // Copy all assets from the theme source directory to the output,
  // excluding the "css" folder.
  fse.copySync(themeSourceDir, outputThemeDir, {
    filter: (src) => {
      // Determine the relative path from the theme source directory.
      const rel = path.relative(themeSourceDir, src);
      // If the relative path starts with "css", skip copying.
      return !rel.startsWith('css');
    }
  });

  // Process the CSS folder separately.
  // Define the path to the source SCSS file for the current build type.
  const sourceCssFile = path.join(themeSourceDir, 'css', `stylesheet.${buildType}.scss`);
  if (!fs.existsSync(sourceCssFile)) {
    throw new Error(`The stylesheet for build type "${buildType}" does not exist at ${sourceCssFile}.`);
  }

  // Compile the SCSS file using Sass.
  let result;
  try {
    result = sass.renderSync({ file: sourceCssFile });
  } catch (err) {
    throw new Error(`Error compiling SCSS file "${sourceCssFile}": ${err.message}`);
  }

  // Ensure the output CSS directory exists.
  const outputCssDir = path.join(outputThemeDir, 'css');
  fse.ensureDirSync(outputCssDir);
  // Define the output CSS file name.
  const outputCssFile = path.join(outputCssDir, `stylesheet.${buildType}.css`);
  fs.writeFileSync(outputCssFile, result.css);

  console.log(`Copied theme "${themeName}" assets (excluding CSS) to: ${outputThemeDir}`);
  console.log(`Compiled SCSS for build type "${buildType}" to: ${outputCssFile}`);
  return manuscript;
}

import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import sass from 'sass';

/**
 * Theme Stage:
 *  - Copies theme assets
 *  - Compiles SCSS => CSS for the chosen buildType
 */
export async function run(manuscript, { stageConfig }) {
  const buildDir = path.join(process.cwd(), 'build', manuscript.buildType);
  const themeDir = path.join(process.cwd(), 'manuscript', 'themes');

  fse.ensureDirSync(buildDir);
  const outputThemeDir = path.join(buildDir, 'themes');
  fse.copySync(themeDir, outputThemeDir, {
    filter: (src) => !src.endsWith('.scss')
  });

  // Attempt to compile a SCSS named "stylesheet.{buildType}.scss"
  const scssFile = path.join(themeDir, 'css', `stylesheet.${manuscript.buildType}.scss`);
  if (!fs.existsSync(scssFile)) {
    console.log(`No SCSS file for ${manuscript.buildType}. Skipping...`);
    return manuscript;
  }

  const sassOptions = stageConfig.sassOptions || { outputStyle: 'expanded' };
  try {
    const result = sass.renderSync({ file: scssFile, ...sassOptions });
    fs.writeFileSync(
      path.join(outputThemeDir, 'css', `stylesheet.${manuscript.buildType}.css`),
      result.css
    );
    console.log(`Compiled SCSS for ${manuscript.buildType} -> CSS`);
  } catch (err) {
    console.error("Error compiling SCSS:", err);
  }

  return manuscript;
}

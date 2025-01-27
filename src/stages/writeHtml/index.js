import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';

export async function run(manuscript, { stageConfig, globalConfig }) {
  // We’ll write the final HTML to build/<buildType>/index.html
  const buildDir = path.join(process.cwd(), 'build', manuscript.buildType);

  // Make sure the build folder exists
  fse.ensureDirSync(buildDir);

  // Write out the final HTML content
  const outputPath = path.join(buildDir, 'index.html');
  fs.writeFileSync(outputPath, manuscript.content, 'utf8');

  console.log(`Wrote final HTML to: ${outputPath}`);
  return manuscript;
}

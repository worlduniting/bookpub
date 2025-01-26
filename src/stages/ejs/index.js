import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

/**
 * EJS Stage:
 *  - Renders .md.ejs => .md
 */
export async function run(manuscript, { stageConfig, globalConfig }) {
  const mainFilePath = path.join(process.cwd(), 'manuscript', 'index.md.ejs');
  if (!fs.existsSync(mainFilePath)) {
    console.log("No index.md.ejs found. Skipping EJS stage...");
    return manuscript;
  }

  const templateContent = fs.readFileSync(mainFilePath, 'utf8');
  const renderedMarkdown = ejs.render(
    templateContent,
    { meta: globalConfig.meta },
    { strict: stageConfig.strict || false }
  );

  manuscript.content = renderedMarkdown;
  return manuscript;
}

import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

export async function run(manuscript, { stageConfig, globalConfig }) {
  // The main EJS file path
  const mainFilePath = path.join(process.cwd(), 'manuscript', 'index.md.ejs');
  if (!fs.existsSync(mainFilePath)) {
    console.log("No index.md.ejs found; skipping EJS stage...");
    return manuscript;
  }

  const templateContent = fs.readFileSync(mainFilePath, 'utf8');

  // Pass 'filename' so EJS knows how to resolve includes relative to index.md.ejs
  const renderedMarkdown = ejs.render(
    templateContent,
    {
      meta: globalConfig.meta,
      buildType: manuscript.buildType
    },
    {
      strict: stageConfig.strict || false,
      filename: mainFilePath // <-- critical for relative includes
    }
  );

  manuscript.content = renderedMarkdown;
  return manuscript;
}

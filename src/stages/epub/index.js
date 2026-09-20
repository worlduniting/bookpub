import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'js-yaml';
import { runPandoc } from '../../utils/runPandoc.js';
import { prepareStylesheets, finalizeEpubArchive } from '../../utils/epubAssets.js';

/** Create an EPUB 3 archive from rendered HTML. Validation is a separate stage. */
export async function run(manuscript, { stageConfig = {}, globalConfig = {} } = {}) {
  const config = stageConfig.config || {};
  const meta = globalConfig.meta || {};
  if (typeof manuscript.content !== 'string' || !manuscript.content.trim()) {
    throw new Error('The epub stage needs rendered HTML. Run the ejs and markdown stages first.');
  }
  if (!meta.title || !(meta.language || meta.lang)) {
    throw new Error('EPUB requires title and language under global.meta or the pipeline meta.');
  }
  const outputFile = config.outputFile || 'book.epub';
  if (typeof outputFile !== 'string' || !/^[^/\\]+\.epub$/i.test(outputFile)) {
    throw new Error('epub.outputFile must be a filename ending in .epub, without directories.');
  }
  const chapterLevel = config.chapterLevel ?? 1;
  const tocDepth = config.tocDepth ?? 3;
  for (const [name, value] of Object.entries({ chapterLevel, tocDepth })) {
    if (!Number.isInteger(value) || value < 1 || value > 6) throw new Error(`epub.${name} must be an integer from 1 to 6.`);
  }

  const projectDir = process.cwd();
  const buildDir = path.join(projectDir, 'build', manuscript.buildType);
  const workRoot = path.join(projectDir, '.bookpub', 'epub');
  await fs.mkdir(workRoot, { recursive: true });
  await fs.mkdir(buildDir, { recursive: true });
  const workDir = await fs.mkdtemp(path.join(workRoot, `${manuscript.buildType}-`));
  const epubPath = path.join(workDir, outputFile);
  manuscript.epub = { path: epubPath, workDir, outputFile };

  try {
    const metadata = { ...meta, lang: meta.language || meta.lang };
    // js-yaml parses unquoted dates as Date objects; Pandoc expects ISO text.
    if (metadata.date instanceof Date) metadata.date = metadata.date.toISOString().slice(0, 10);
    if (!metadata.identifier) {
      const isbn = meta['isbn-13'] || meta.isbn || meta['isbn-10'];
      if (isbn) metadata.identifier = `urn:isbn:${isbn}`;
    }
    const inputPath = path.join(workDir, 'input.html');
    const metadataPath = path.join(workDir, 'metadata.yml');
    await fs.writeFile(inputPath, manuscript.content);
    await fs.writeFile(metadataPath, YAML.dump(metadata, { noRefs: true }));

    const css = config.css === undefined
      ? [path.join(buildDir, 'themes', 'css', `styles.${manuscript.themeStyleType || manuscript.buildType}.css`)]
      : (Array.isArray(config.css) ? config.css : [config.css]).map(file => path.resolve(projectDir, file));
    const prepared = await prepareStylesheets(css, workDir);
    const args = [
      '--from=html', '--to=epub3', '--standalone', '--toc',
      `--toc-depth=${tocDepth}`, `--split-level=${chapterLevel}`,
      `--epub-title-page=${config.titlePage === true}`, '--fail-if-warnings',
      '--metadata-file', metadataPath,
      // HTML <title> and lang otherwise take precedence over a metadata file.
      '--metadata', `title=${meta.title}`, '--metadata', `lang=${metadata.lang}`,
      '--resource-path', [buildDir, path.join(projectDir, 'manuscript'), projectDir].join(path.delimiter),
      ...prepared.stylesheets.flatMap(file => ['--css', file]),
      '--output', epubPath, inputPath
    ];
    if (config.coverImage) args.push('--epub-cover-image', path.resolve(projectDir, config.coverImage));
    await runPandoc(config.pandocPath || manuscript.pandocPath || 'pandoc', args, { cwd: buildDir });
    await finalizeEpubArchive(epubPath, prepared.resources);
    console.log(`Created EPUB for checking: ${path.relative(projectDir, epubPath)}`);
    return manuscript;
  } catch (error) {
    throw new Error(`${error.message}\nEPUB build files retained at: ${path.relative(projectDir, workDir)}`);
  }
}

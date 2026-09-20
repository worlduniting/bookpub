import fs from 'node:fs/promises';
import path from 'node:path';

/** Validate the finished archive with the npm-installed JavaScript/WASM engine. */
export async function run(manuscript, { stageConfig = {} } = {}) {
  const config = stageConfig.config || {};
  const epubPath = config.inputFile ? path.resolve(config.inputFile) : manuscript.epub?.path;
  if (!epubPath) throw new Error('The epubCheck stage needs an EPUB. Run epub first or set epubCheck.config.inputFile.');
  const reportPath = manuscript.epub?.workDir
    ? path.join(manuscript.epub.workDir, 'epubcheck.json')
    : `${epubPath}.check.json`;

  try {
    // Lazy loading keeps the WASM engine out of unrelated HTML/PDF builds.
    const { EpubCheck, VERSION } = await import('@likecoin/epubcheck-ts');
    console.log(`Checking EPUB with epubcheck-ts ${VERSION}...`);
    const result = await EpubCheck.validate(new Uint8Array(await fs.readFile(epubPath)));
    const failed = !result.valid || result.fatalCount > 0 || result.errorCount > 0 ||
      (config.failOnWarnings === true && result.warningCount > 0);
    const report = { engine: 'epubcheck-ts', engineVersion: VERSION, passed: !failed, ...result };
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
    manuscript.epubCheck = { ...report, reportPath };
    for (const message of result.messages) {
      const location = message.location;
      const position = location
        ? [location.path, location.line, location.column].filter(value => value !== undefined && value !== null).join(':')
        : '';
      const output = `${message.severity.toUpperCase()} ${message.id}${position ? ` ${position}` : ''}\n  ${message.message}`;
      if (message.severity === 'fatal' || message.severity === 'error') console.error(output);
      else if (message.severity === 'warning') console.warn(output);
      else console.log(output);
    }
    const summary = `${result.fatalCount} fatal, ${result.errorCount} error(s), ${result.warningCount} warning(s)`;
    if (failed) throw new Error(`EPUB validation failed: ${summary}.`);
    console.log(`EPUB validation passed: ${summary}.`);
    return manuscript;
  } catch (error) {
    throw new Error(`${error.message}\nEPUB retained at: ${path.relative(process.cwd(), epubPath)}\nValidation report (if available): ${path.relative(process.cwd(), reportPath)}`);
  }
}

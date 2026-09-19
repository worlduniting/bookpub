import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/** Write a completed EPUB to the build output; the default pipeline checks first. */
export async function run(manuscript) {
  const epub = manuscript.epub;
  if (!epub?.path) throw new Error('The writeEpub stage requires an archive from the epub stage.');
  if (manuscript.epubCheck?.passed === false) throw new Error('Cannot write an EPUB that failed validation.');
  const buildDir = path.join(process.cwd(), 'build', manuscript.buildType);
  await fs.mkdir(buildDir, { recursive: true });
  const outputPath = path.join(buildDir, epub.outputFile);
  const temporaryPath = path.join(buildDir, `.${epub.outputFile}.${randomUUID()}.tmp`);
  try {
    await fs.copyFile(epub.path, temporaryPath);
    if (manuscript.epubCheck?.reportPath) {
      const reportPath = path.join(buildDir, 'epubcheck.json');
      await fs.copyFile(manuscript.epubCheck.reportPath, reportPath);
      manuscript.epubCheck.reportPath = reportPath;
    }
    await fs.rename(temporaryPath, outputPath);
  } finally {
    await fs.rm(temporaryPath, { force: true });
  }
  if (epub.workDir) await fs.rm(epub.workDir, { recursive: true, force: true });
  manuscript.epub = { ...epub, path: outputPath, workDir: undefined };
  console.log(`Wrote EPUB to: ${path.relative(process.cwd(), outputPath)}`);
  return manuscript;
}

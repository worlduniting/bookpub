import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import YAML from 'js-yaml';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import { EpubCheck } from '@likecoin/epubcheck-ts';
import { run as checkEpub } from '../src/stages/epubCheck/index.js';

const repo = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(repo, 'bin/bookpub.js');
const projects = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMIaNryHwAFMgKGRu/JzgAAAABJRU5ErkJggg==', 'base64');
const stages = [
  { name: 'ejs' }, { name: 'markdown' }, { name: 'themes', config: { styleType: 'epub' } },
  { name: 'epub' }, { name: 'epubCheck' }, { name: 'writeEpub' }
];

async function project({ content, config = {}, css = 'body { font-family: serif; }' } = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'Bookpub EPUB test-'));
  projects.push(dir);
  await fs.mkdir(path.join(dir, 'manuscript/themes/default/css'), { recursive: true });
  await fs.mkdir(path.join(dir, 'manuscript/themes/default/images'), { recursive: true });
  await fs.writeFile(path.join(dir, 'manuscript/themes/default/images/picture.png'), png);
  await fs.writeFile(path.join(dir, 'manuscript/themes/default/css/styles.epub.scss'), css);
  await fs.writeFile(path.join(dir, 'manuscript/index.md.ejs'), content ?? `
# <%= meta.title %>

By <%= meta.author %>.

<div class="chapter" id="chapter-one">
<h1>A nested chapter</h1>
<p>The manuscript text survives packaging.</p>
<img src="themes/images/picture.png" alt="An example image" />
</div>

# Another chapter

[Return to chapter one](#chapter-one).
`);
  await fs.writeFile(path.join(dir, 'book.config.yml'), YAML.dump({
    global: {
      meta: { title: 'A book & its tests', author: 'Test Author', language: 'en', identifier: 'urn:uuid:62dafbdf-67ee-4df6-b63b-c186ca382d2c' },
      stages: [{ name: 'markdown', config: { pandocPath: 'pandoc' } }]
    },
    ...config
  }));
  return dir;
}

function build(dir, type = 'epub') {
  const result = spawnSync(process.execPath, [cli, 'build', type], { cwd: dir, encoding: 'utf8', timeout: 60000 });
  assert.ifError(result.error);
  return { ...result, output: result.stdout + result.stderr };
}

async function archive(dir, type = 'epub', file = 'book.epub') {
  const bytes = await fs.readFile(path.join(dir, 'build', type, file));
  return { bytes, files: unzipSync(bytes) };
}

async function missing(file) {
  await assert.rejects(fs.access(file), { code: 'ENOENT' });
}

after(async () => {
  for (const dir of projects) await fs.rm(dir, { recursive: true, force: true });
});

test('native default pipeline builds and checks EPUB with working navigation, media and ZIP structure', async () => {
  const dir = await project();
  const result = build(dir);
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /EPUB validation passed/);
  const { bytes, files } = await archive(dir);
  assert.equal(bytes.readUInt32LE(0), 0x04034b50);
  assert.equal(bytes.readUInt16LE(8), 0, 'mimetype must be stored without compression');
  assert.equal(bytes.readUInt16LE(28), 0, 'mimetype must have no extra field');
  assert.equal(bytes.subarray(30, 38).toString(), 'mimetype');
  assert.equal(strFromU8(files.mimetype), 'application/epub+zip');
  assert.ok(files['META-INF/container.xml']);
  assert.ok(files['EPUB/nav.xhtml']);
  assert.doesNotMatch(strFromU8(files['EPUB/nav.xhtml']), /text\/#/);
  assert.ok(Object.keys(files).some(name => name.startsWith('EPUB/media/') && name.endsWith('.png')));
  const chapters = Object.entries(files).filter(([name]) => name.startsWith('EPUB/text/')).map(([, data]) => strFromU8(data)).join('\n');
  assert.match(chapters, /The manuscript text survives packaging/);
  const report = JSON.parse(await fs.readFile(path.join(dir, 'build/epub/epubcheck.json')));
  assert.equal(report.engine, 'epubcheck-ts');
  assert.equal(report.engineVersion, '0.7.0');
  assert.equal(report.passed, true);
  assert.equal(report.valid, true);
  assert.equal(report.errorCount, 0);
  assert.deepEqual(await fs.readdir(path.join(dir, '.bookpub/epub')), []);

  // The npm-installed engine contains its WASM payload and validates offline.
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Validation must not need a download'); };
  try {
    assert.equal((await EpubCheck.validate(bytes)).valid, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('validation errors fail the CLI and retain the invalid archive and report', async () => {
  const dir = await project({ content: '# Broken book\n\n[Missing target](#missing-target)\n' });
  const result = build(dir);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /EPUB validation failed/);
  assert.doesNotMatch(result.output, /Build pipeline complete/);
  await missing(path.join(dir, 'build/epub/book.epub'));
  const [retained] = await fs.readdir(path.join(dir, '.bookpub/epub'));
  await fs.access(path.join(dir, '.bookpub/epub', retained, 'book.epub'));
  const report = JSON.parse(await fs.readFile(path.join(dir, '.bookpub/epub', retained, 'epubcheck.json')));
  assert.equal(report.passed, false);
  assert.ok(report.errorCount > 0);
});

test('local CSS imports and images are packaged and declared in the manifest', async () => {
  const dir = await project({ css: '@import "extra.css"; p { background-image: url("../images/picture.png"); }' });
  await fs.writeFile(path.join(dir, 'manuscript/themes/default/css/extra.css'), '@import "nested.css"; h1 { color: navy; background-image: url("../images/picture.png"); }');
  await fs.writeFile(path.join(dir, 'manuscript/themes/default/css/nested.css'), 'p { color: black; }');
  const result = build(dir);
  assert.equal(result.status, 0, result.output);
  const { files } = await archive(dir);
  const assets = Object.keys(files).filter(name => name.startsWith('EPUB/bookpub-assets/'));
  assert.equal(assets.length, 3);
  assert.ok(assets.some(name => name.endsWith('.css')));
  assert.ok(assets.some(name => name.endsWith('.png')));
  const opf = strFromU8(files['EPUB/content.opf']);
  for (const asset of assets) assert.ok(opf.includes(asset.slice('EPUB/'.length)));
});

test('missing images fail generation instead of silently producing an incomplete book', async () => {
  const dir = await project({ content: '# Missing image\n\n![Required image](themes/images/missing.png)' });
  const result = build(dir);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /Could not fetch resource|CouldNotFetchResource|does not exist/i);
  await missing(path.join(dir, 'build/epub/book.epub'));
});

test('custom pipelines can omit checking while retaining native generation and output stages', async () => {
  const dir = await project({
    content: '# Unchecked\n\n[Missing target](#missing-target)',
    config: { buildPipelines: { unchecked: { stages: stages.filter(stage => stage.name !== 'epubCheck') } } }
  });
  const result = build(dir, 'unchecked');
  assert.equal(result.status, 0, result.output);
  assert.doesNotMatch(result.output, /Checking EPUB/);
  const { bytes } = await archive(dir, 'unchecked');
  assert.equal((await EpubCheck.validate(bytes)).valid, false, 'test fixture must really be invalid');
  await missing(path.join(dir, 'build/unchecked/epubcheck.json'));
});

test('a broken local check stage fails rather than being silently skipped', async () => {
  const dir = await project();
  await fs.mkdir(path.join(dir, 'stages/epubCheck'), { recursive: true });
  await fs.writeFile(path.join(dir, 'package.json'), '{"type":"module"}');
  await fs.writeFile(path.join(dir, 'stages/epubCheck/index.js'), 'export const broken = true;');
  const result = build(dir);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, /No 'run' function found for stage: epubCheck/);
  await missing(path.join(dir, 'build/epub/book.epub'));
});

test('pipeline metadata overrides, output filename and cover image reach the finished EPUB', async () => {
  const dir = await project({
    content: '<html lang="de"><head><title>Old HTML title</title></head><body><h1>A chapter</h1><p>Book text.</p></body></html>',
    config: { buildPipelines: { epub: {
    meta: { title: 'Pipeline Title', language: 'fr' },
    stages: stages.map(stage => stage.name === 'epub' ? { name: 'epub', config: {
      outputFile: 'my-book.epub', coverImage: 'manuscript/themes/default/images/picture.png'
    } } : stage)
  } } } });
  const result = build(dir);
  assert.equal(result.status, 0, result.output);
  const { files } = await archive(dir, 'epub', 'my-book.epub');
  const opf = new DOMParser().parseFromString(strFromU8(files['EPUB/content.opf']), 'application/xml');
  assert.equal(opf.getElementsByTagName('dc:title')[0].textContent, 'Pipeline Title');
  assert.equal(opf.getElementsByTagName('dc:language')[0].textContent, 'fr');
  assert.match(strFromU8(files['EPUB/content.opf']), /properties="cover-image"/);
});

test('real warnings pass by default and fail when failOnWarnings is enabled', async () => {
  const dir = await project();
  const result = build(dir);
  assert.equal(result.status, 0, result.output);
  const { files } = await archive(dir);
  // Empty @font-face produces the real CSS-019 warning without a fatal/error.
  files['EPUB/styles/stylesheet1.css'] = strToU8(strFromU8(files['EPUB/styles/stylesheet1.css']) + '\n@font-face {}');
  const entries = { mimetype: [files.mimetype, { level: 0 }], ...files };
  entries.mimetype = [files.mimetype, { level: 0 }];
  const inputFile = path.join(dir, 'warning.epub');
  await fs.writeFile(inputFile, zipSync(entries));
  const manuscript = {};
  await checkEpub(manuscript, { stageConfig: { config: { inputFile } } });
  assert.ok(manuscript.epubCheck.warningCount > 0);
  assert.equal(manuscript.epubCheck.passed, true);
  await assert.rejects(checkEpub({}, { stageConfig: { config: { inputFile, failOnWarnings: true } } }), /EPUB validation failed/);
});

test('the shipped example book passes the complete pipeline', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'Bookpub EPUB example-'));
  projects.push(dir);
  await fs.cp(path.join(repo, 'src/templates/example-book'), dir, { recursive: true });
  const result = build(dir);
  assert.equal(result.status, 0, result.output);
  const { bytes } = await archive(dir);
  assert.ok(bytes.length > 0);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import * as cssTree from 'css-tree';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';

const OPF_NS = 'http://www.idpf.org/2007/opf';
const MEDIA_TYPES = {
  '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

/**
 * Pandoc copies stylesheets without resolving their URLs. Relocate local CSS
 * dependencies (including nested imports, fonts and images) into the EPUB.
 * The returned root stylesheets are ready for Pandoc's EPUB/styles directory.
 */
export async function prepareStylesheets(stylesheets, workDir) {
  const resources = new Map();

  async function rewriteCss(sourcePath) {
    const ast = cssTree.parse(await fs.readFile(sourcePath, 'utf8'));
    const references = new Set();
    cssTree.walk(ast, node => {
      if (node.type === 'Declaration' || (node.type === 'Atrule' && node.name.toLowerCase() === 'import')) {
        cssTree.walk(node, value => {
          if (value.type === 'Url') references.add(value);
        });
        if (node.type === 'Atrule' && node.prelude) {
          const first = node.prelude.children.first;
          if (first?.type === 'String') references.add(first);
        }
      }
    });
    for (const reference of references) {
      const href = reference.value;
      if (!href || /^(?:#|[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
      const separator = href.search(/[?#]/);
      const pathname = separator < 0 ? href : href.slice(0, separator);
      const suffix = separator < 0 ? '' : href.slice(separator);
      const source = path.resolve(path.dirname(sourcePath), decodeURIComponent(pathname));
      let resource = resources.get(source);
      if (!resource) {
        const extension = path.extname(source).toLowerCase();
        const mediaType = MEDIA_TYPES[extension];
        if (!mediaType) throw new Error(`Unsupported EPUB stylesheet resource: ${source}. Use EPUB-compatible images or TTF, OTF, WOFF or WOFF2 fonts.`);
        resource = { name: `bookpub-asset-${resources.size + 1}${extension}`, mediaType };
        // Register before recursion so cyclic CSS imports terminate.
        resources.set(source, resource);
        try {
          resource.bytes = extension === '.css'
            ? strToU8(await rewriteCss(source))
            : new Uint8Array(await fs.readFile(source));
        } catch (error) {
          throw new Error(`Could not package stylesheet resource "${source}": ${error.message}`);
        }
      }
      // Both stylesheets and relocated dependencies live one level under EPUB/.
      reference.value = `../bookpub-assets/${resource.name}${suffix}`;
    }
    return cssTree.generate(ast);
  }

  const prepared = [];
  for (const [index, stylesheet] of stylesheets.entries()) {
    const target = path.join(workDir, `stylesheet-${index + 1}.css`);
    await fs.writeFile(target, await rewriteCss(stylesheet));
    prepared.push(target);
  }
  return { stylesheets: prepared, resources: [...resources.values()] };
}

/** Finish Pandoc's archive and OPF manifest before validating the final bytes. */
export async function finalizeEpubArchive(epubPath, resources) {
  const archive = unzipSync(await fs.readFile(epubPath));
  const parser = new DOMParser({ errorHandler: {
    warning() {}, error(message) { throw new Error(message); }, fatalError(message) { throw new Error(message); }
  } });
  const container = parser.parseFromString(strFromU8(archive['META-INF/container.xml']), 'application/xml');
  const rootfile = container.getElementsByTagName('rootfile')[0];
  const opfPath = rootfile?.getAttribute('full-path');
  if (!opfPath || !archive[opfPath]) throw new Error('Pandoc EPUB has no package document.');
  const document = parser.parseFromString(strFromU8(archive[opfPath]), 'application/xml');
  const manifest = document.getElementsByTagNameNS(OPF_NS, 'manifest')[0];
  if (!manifest) throw new Error('Pandoc EPUB has no manifest.');
  for (const resource of resources) {
    const href = `bookpub-assets/${resource.name}`;
    archive[path.posix.join(path.posix.dirname(opfPath), href)] = resource.bytes;
    const item = document.createElementNS(OPF_NS, 'item');
    item.setAttribute('id', resource.name);
    item.setAttribute('href', href);
    item.setAttribute('media-type', resource.mediaType);
    manifest.appendChild(item);
  }
  archive[opfPath] = strToU8(new XMLSerializer().serializeToString(document));

  // Pandoc 3.1 can omit or misidentify the chapter in generated navigation,
  // especially for nested headings and titles matching an inserted heading.
  // Repair a broken navigation fragment only when exactly one chapter has its
  // ID. Missing/ambiguous IDs and all source-content links stay unchanged.
  const destinations = new Map();
  const chapterIds = new Map();
  const opfDir = path.posix.dirname(opfPath);
  for (const [name, bytes] of Object.entries(archive)) {
    if (!name.startsWith(`${opfDir}/text/`) || !name.endsWith('.xhtml')) continue;
    const chapter = parser.parseFromString(strFromU8(bytes), 'application/xml');
    const ids = new Set();
    for (const element of Array.from(chapter.getElementsByTagName('*'))) {
      const id = element.getAttribute('id');
      if (id) {
        ids.add(id);
        destinations.set(id, destinations.has(id) ? null : name);
      }
    }
    chapterIds.set(name, ids);
  }
  for (const name of [`${opfDir}/nav.xhtml`, `${opfDir}/toc.ncx`]) {
    if (!archive[name]) continue;
    const nav = parser.parseFromString(strFromU8(archive[name]), 'application/xml');
    let changed = false;
    for (const element of Array.from(nav.getElementsByTagName('*'))) {
      const attribute = element.localName === 'content' ? 'src' : 'href';
      const href = element.getAttribute(attribute);
      if (!href?.startsWith('text/') || !href.includes('#')) continue;
      const separator = href.indexOf('#');
      const fragment = href.slice(separator + 1);
      const id = decodeURIComponent(fragment);
      const referencedPath = path.posix.join(path.posix.dirname(name), decodeURIComponent(href.slice(0, separator)));
      if (chapterIds.get(referencedPath)?.has(id)) continue;
      const destination = destinations.get(id);
      if (destination) {
        element.setAttribute(attribute, `${path.posix.relative(path.posix.dirname(name), destination)}#${fragment}`);
        changed = true;
      }
    }
    if (changed) archive[name] = strToU8(new XMLSerializer().serializeToString(nav));
  }

  // EPUB requires the first ZIP entry to be exactly this uncompressed file.
  const entries = Object.create(null);
  entries.mimetype = [strToU8('application/epub+zip'), { level: 0 }];
  for (const [name, bytes] of Object.entries(archive)) {
    if (name !== 'mimetype') entries[name] = bytes;
  }
  await fs.writeFile(epubPath, zipSync(entries, { level: 6 }));
}

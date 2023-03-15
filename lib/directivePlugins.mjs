/* 
    This loads all the custom directives in the plugins/ folder
    which will then be loaded into the convert.mjs file.
*/

import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const readdir = promisify(fs.readdir);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginsFolder = path.join(__dirname, 'plugins');

export async function loadPlugins() {
    const pluginFiles = await readdir(pluginsFolder);
    return Promise.all(
        pluginFiles.map(async (file) => {
            if (file.endsWith('.mjs')) {
                const { default: plugin } = await import(path.join(pluginsFolder, file));
                return plugin;
            }
        })
    );
}

loadPlugins().catch((error) => {
    console.error(error);
});

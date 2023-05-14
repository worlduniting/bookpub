// File: archiveAndClean.js
import fs from 'fs';
import tar from 'tar';
import moment from 'moment';
import path from 'path';
import { promisify } from 'util';
import rimraf from 'rimraf';
import chalk from 'chalk';

const rm = promisify(rimraf);

async function archiveAndClean(srcFolder, destFolder) {
    const date = moment();
    const archiveName = `testbuild.${date.format('MM-DD-HHmm')}.tar.gz`;

    // Ensure the archive directory exists
    fs.mkdirSync(destFolder, { recursive: true });

    // Create the archive
    await tar.c({
        gzip: true,
        file: path.join(destFolder, archiveName),
        cwd: srcFolder,
        sync: true,
    }, ['.']);

    // Remove the source directory contents
    await rm(path.join(srcFolder, '*'));

    console.log(chalk.yellowBright(`\n     Created archive of test builds: ${chalk.white(path.relative(process.cwd(), path.join(destFolder, archiveName)))}\n`));
    console.log(chalk.yellow('          Run \'npm run test:clean\' to remove archives and test build directories.\n'));
}

export default archiveAndClean;

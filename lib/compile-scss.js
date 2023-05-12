import fs from 'fs';
import sass from 'sass';
import chalk from 'chalk';

export default async function compileSASS(scssInput, cssOutput) {
    try {
        const result = sass.renderSync({ file: scssInput, outputStyle: 'compressed' });
        fs.writeFileSync(cssOutput, result.css);
    } catch (error) {
        console.error(chalk.red('Error Compiling SASS:'), chalk.red(error));
    }
}

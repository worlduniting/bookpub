import fs from 'fs';
import sass from 'sass';
import path from 'path';
import chalk from 'chalk';

export async function compileSCSSToCSS(scssInput, cssOutput) {
    console.log(`Rendering ${path.basename(scssInput)}...\n`);
    try {
        const result = sass.renderSync({ file: scssInput, outputStyle: 'compressed' });
        fs.writeFileSync(cssOutput, result.css);
    } catch (error) {
        console.error(chalk.red('Error Compiling SASS:'), chalk.red(error));
    }
}

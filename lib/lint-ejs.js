import ejsLint from 'ejs-lint';
import chalk from 'chalk';

export default async function lintEjs(ejsContent, ejsLintOpt) {
    try {
        const lintedEjs = await ejsLint(ejsContent, ejsLintOpt);
        console.log('Linted EJS content:', lintedEjs);
        return lintedEjs || ejsContent; // Return the original content if no linting errors are found
    } catch (error) {
        console.error(chalk.red('Error Linting EJS Content:'), chalk.red(error));
    }
}

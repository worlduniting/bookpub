import { readFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import chalk from 'chalk';

export default async function loadBookConfig(bookPath) {
    const bookConfigPath = bookPath;

    if (!existsSync(bookConfigPath)) {
        console.error(chalk.red('book.config.yml not found in the current working directory.'));
        process.exit(1);
    }

    try {
        const bookConfig = yaml.load(readFileSync(bookConfigPath, 'utf8'));
        return bookConfig;
    } catch (error) {
        console.error(chalk.redBright('Error loading book.config.yml:'), chalk.redBright(error));
        process.exit(1);
    }
}
import chalk from 'chalk';
import cliui from 'cliui';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

async function lintEjsFile(filePath, ejsLintOpt) {
    return new Promise((resolve, reject) => {
        exec(`npx ejs-lint "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                const ui = cliui({ wrap: false });
                ui.div(
                    { text: chalk.yellowBright(`Error Linting EJS Content in ${filePath}:\n`), padding: [0, 0, 0, 5] }
                )
                ui.div(
                    { text: chalk.white(error), padding: [0, 0, 0, 5] }
                )
                console.error(ui.toString());
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function lintEjsFolder(folderPath, ejsLintOpt) {
    const files = fs.readdirSync(folderPath);
    const errors = [];

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.lstatSync(filePath);

        if (stat.isDirectory()) {
            errors.push(...(await lintEjsFolder(filePath, ejsLintOpt)));
        } else if (stat.isFile() && filePath.endsWith('.ejs')) {
            try {
                await lintEjsFile(filePath, ejsLintOpt);
            } catch (error) {
                errors.push(chalk.yellow({ filePath, error }));
            }
        }
    }

    return errors;
}

export default async function lintEjs(manuscriptDir, ejsLintOpt) {
    const errors = await lintEjsFolder(manuscriptDir, ejsLintOpt);

    if (errors.length > 0) {
        throw new Error(`Found ${errors.length} linting errors.`);
    }
}

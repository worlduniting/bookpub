import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function createNewBook(projectName) {
    // Update the questions array to use the projectName argument as the default value
    const questions = [
        {
            type: 'input',
            name: 'projectName',
            message: "What is your project name?",
            default: projectName,
        },
        {
            type: 'input',
            name: 'bookTitle',
            message: "What is your book's title?",
            default: projectName,
        },
        {
            type: 'input',
            name: 'subTitle',
            message: "What is the subtitle?"
        },
        {
            type: 'input',
            name: 'authorName',
            message: "What is the author's name?",
        },
        {
            type: 'input',
            name: 'bookDescription',
            message: "What's the book about?",
        },
        {
            type: 'input',
            name: 'gitRepository',
            message: `Do you have a git repository? (e.g. https://github.com/username/${projectName}`,
        },
        {
            type: 'input',
            name: 'bookTemplateGitUrl',
            message: "Do you have a book template git URL? (Leave empty if not)",
        },
        {
            type: 'input',
            name: 'randomQuestion',
            message: "What is the airspeed velocity of an unladen swallow?",
        },
    ];

    try {
        // Get user input
        const answers = await inquirer.prompt(questions);

        // Create the project directory
        const projectPath = path.resolve(process.cwd(), answers.projectName);
        await fs.ensureDir(projectPath);
        console.log(chalk.greenBright(`\nCreating your new project directory: ${chalk.yellowBright(`${projectName}/`)}.\n`));

        // Path to package.json
        const packageJsonPath = path.join(projectPath, 'package.json');

        // Check if package.json exists
        const packageJsonExists = await fs.pathExists(packageJsonPath);

        const bookPubPackageJsonPath = path.join(__dirname, '../package.json');
        const bookPubPackageJson = await fs.readJson(bookPubPackageJsonPath);
        const bookPubVersion = bookPubPackageJson.version;


        let packageJson;

        if (packageJsonExists) {
            // Read the existing package.json
            packageJson = await fs.readJson(packageJsonPath);

            // Update the relevant fields
            packageJson.name = answers.bookTitle;
            packageJson.description = answers.bookDescription;
            packageJson.repository = {
                type: 'git',
                url: answers.gitRepository,
            };
            packageJson.dependencies = {
                ...packageJson.dependencies,
                bookpub: `^${bookPubVersion}`,
            }
        } else {
            // Create a new package.json with the given data
            packageJson = {
                name: answers.projectName,
                version: '0.1.0',
                description: answers.bookDescription,
                author: answers.authorName,
                repository: {
                    type: 'git',
                    url: answers.gitRepository,
                },
                dependencies: {
                    bookpub: `^${bookPubVersion}`,
                }
            };
        }

        // Write the updated or new package.json
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        console.log(chalk.greenBright('Updated package.json with your settings.\n'));

        // Copy the BookPub example-book folder to the user's new project folder as manuscript
        const exampleBookPath = path.join(__dirname, '../example-book');

        if (!answers.bookTemplateGitUrl) {
            await fs.copy(exampleBookPath, projectPath);
            console.log(chalk.greenBright('Installed default book into your project.\n'));
        }

        // Check for book.config.yml file
        const bookConfigPath = path.join(projectPath, 'book.config.yml');

        if (await fs.pathExists(bookConfigPath)) {
            // Read the existing book.config.yml
            const bookConfigContent = await fs.readFile(bookConfigPath, 'utf8');
            const bookConfig = yaml.load(bookConfigContent);

            // Update the relevant fields
            if (bookConfig.meta) {
                bookConfig.meta.title = answers.bookTitle;
                bookConfig.meta.subtitle = answers.subtitle;
                bookConfig.meta.author = answers.authorName;
            }

            // Write the updated book.config.yml
            await fs.writeFile(bookConfigPath, yaml.dump(bookConfig), 'utf8');
            console.log(chalk.greenBright('Updated book.config.yml with your settings.\n'));
        } else {
            // Create a book.config.yml with the given data
            const bookConfig = {
                meta: {
                    title: answers.bookTitle,
                    subtitle: answers.subtitle,
                    author: answers.authorName,
                },
                settings: {
                    entryfile: 'index.md.ejs',
                },
                'ejs-lint-options': {
                    await: true,
                    'preprocessor-include': null,
                    delimiter: null,
                },
            };

            // Write the book.config.yml
            await fs.writeFile(bookConfigPath, yaml.dump(bookConfig), 'utf8');
            delayMe(console.log(chalk.greenBright('Created book.config.yml with your settings.\n')));
        }

        console.log(chalk.yellowBright(
            '     Project created successfully!\n\n' +
            `     (1) Change into your new project directory: ${chalk.white(`\'cd ${projectName}\'`)}\n\n` +
            `     (2) Run: ${chalk.white('\'bookpub dev -t html\'')} to build and view your new book in Dev Mode.\n\n`
            ));
    } catch (error) {
        console.error('Error:', error.message);
    }
};
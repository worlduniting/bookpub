/**
 * @module newProject
 * @description
 * This module provides functionality for scaffolding a new Bookpub project.
 * It prompts the user for project and book details, copies a template (either the default or a custom git-cloned one),
 * updates/creates the project's package.json, and writes a new book.config.yml file.
 *
 * The generated book.config.yml now follows a new structure:
 *
 *   global:
 *     meta:
 *       // Global metadata applied to all build pipelines
 *     stages:
 *       // Default stage-specific settings applied in all pipelines
 *
 *   #buildPipelines:
 *   #  html:
 *   #    meta:
 *   #      version: 2.1
 *   #      title: The HTML Title
 *   #
 *   #  pdf:
 *   #    meta:
 *   #      version: 2.1
 *   #      title: The PDF Title
 *   #    stages:
 *   #      - name: ejs
 *   #        config:
 *   #          rmWhitespace: false  # Overrides global setting
 *   #      - name: markdown
 *   #      - name: theme
 *   #      - name: writeHtml
 *   #      - name: pdf
 *
 * @example
 * // To create a new Bookpub project:
 * bookpub new my-book
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prompts the user and creates a new Bookpub project.
 *
 * @async
 * @function newProject
 * @param {string} initialProjectName - The default project name.
 */
export async function newProject(initialProjectName) {
  // 1. Prompt the user for project details
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Name?',
      default: initialProjectName
    },
    {
      type: 'input',
      name: 'bookTitle',
      message: 'Book Title?',
      default: 'Title'
    },
    {
      type: 'input',
      name: 'subTitle',
      message: 'Book Subtitle?',
      default: 'Subtitle'
    },
    {
      type: 'input',
      name: 'authorName',
      message: "Author's Name?",
      default: 'My Name'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description?',
      default: 'My great description'
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version/Edition?',
      default: '1.0'
    },
    {
      type: 'input',
      name: 'bookTemplateGitUrl',
      message: 'Custom book template URL (optional)? (git clone URL)',
      default: ''
    }
  ]);

  const projectName = answers.projectName;
  const bookTitle = answers.bookTitle;
  const subTitle = answers.subTitle;
  const authorName = answers.authorName;
  const description = answers.description;
  const version = answers.version;
  const templateGitUrl = answers.bookTemplateGitUrl.trim();

  // 2. Prepare the path for the new project
  const projectPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`\nA folder named "${projectName}" already exists. Aborting.\n`));
    process.exit(1);
  }
  fs.ensureDirSync(projectPath);

  console.log(chalk.greenBright(`\nCreating new Bookpub project: "${projectName}"\n`));

  // 3. Decide on the template source
  let templateSource;
  let clonedTempPath = '';

  if (templateGitUrl) {
    console.log(chalk.blue(`Cloning book template from: ${templateGitUrl}`));
    clonedTempPath = path.join(__dirname, '../../temp-clone');
    fs.removeSync(clonedTempPath);

    const cloneResult = spawnSync('git', ['clone', templateGitUrl, clonedTempPath], {
      stdio: 'inherit'
    });

    if (cloneResult.status !== 0) {
      console.log(chalk.red('\nFailed to clone the Git repository. Aborting.\n'));
      process.exit(cloneResult.status || 1);
    }
    console.log(chalk.green('Git clone successful.\n'));
    templateSource = clonedTempPath;
  } else {
    templateSource = path.join(__dirname, '../templates/example-book');
    console.log(chalk.green('Installing default example-book template...\n'));
  }

  // 4. Copy the template into the project folder
  try {
    await fs.copy(templateSource, projectPath);
  } catch (err) {
    console.log(chalk.red(`\nError copying template: ${err.message}\n`));
    process.exit(1);
  }

  if (clonedTempPath && fs.existsSync(clonedTempPath)) {
    fs.removeSync(clonedTempPath);
  }

  // 5. Update package.json with user inputs
  const packageJsonPath = path.join(projectPath, 'package.json');
  let packageJsonData = {};

  if (fs.existsSync(packageJsonPath)) {
    packageJsonData = await fs.readJson(packageJsonPath);
  }

  packageJsonData.name = projectName;
  packageJsonData.version = version;
  packageJsonData.description = description;
  packageJsonData.author = authorName;
  packageJsonData.license = packageJsonData.license || 'MIT';
  if (!packageJsonData.repository) {
    packageJsonData.repository = {
      type: 'git',
      url: ''
    };
  }

  const bookpubPackageJsonPath = path.join(__dirname, '../../package.json');
  const bookpubPackageJson = fs.readJsonSync(bookpubPackageJsonPath);
  const bookpubVersion = bookpubPackageJson.version || 'latest';

  packageJsonData.dependencies = packageJsonData.dependencies || {};
  packageJsonData.dependencies.bookpub = `^${bookpubVersion}`;

  fs.writeJsonSync(packageJsonPath, packageJsonData, { spaces: 2 });
  console.log(chalk.greenBright('package.json created/updated.\n'));

  // 6. Create or update book.config.yml using the new structure
  const bookConfigPath = path.join(projectPath, 'book.config.yml');
  
  // Define the new configuration structure
  const newBookConfig = {
    global: {
      meta: {
        title: bookTitle,
        subtitle: subTitle,
        author: authorName,
        description: description,
        // Additional metadata fields can be left blank or added later:
        'isbn-13': '',
        'isbn-10': '',
        publisher: '',
        date: '',
        language: '',
        subject: '',
        rights: '',
        version: version,
        lccn: ''
      },
      stages: [
        {
          name: 'ejs',
          meta: {
            title: 'EJS stage-related title'
          },
          config: {
            entryfile: 'index.md.ejs',
            rmWhitespace: true
          }
        },
        {
          name: 'markdown',
          config: {
            pandocPath: 'pandoc'
          }
        }
      ]
    }
  };

  // Write the new configuration file
  fs.writeFileSync(bookConfigPath, yaml.dump(newBookConfig), 'utf8');
  console.log(chalk.green('book.config.yml created/updated.\n'));

  // 7. Append a commented-out pipeline snippet for user customization
  const pipelineSnippet = `
## -----------------------~~~~~~~~~~~~~~~
##  CUSTOM BUILD-PIPELINES & OVERRIDES
##    * Define build-piplines
##    * Add build-specific settings
## -----------------------~~~~~~~~~~~~~~~~

buildPipelines:
  html:
    stages:
      - name: ejs
      - name: markdown
      - name: themes
      - name: writeHtml

  pdf:
    stages:
      - name: ejs
      - name: markdown
      - name: themes
      - name: writeHtml
      - name: pdf

# Add your own custom buildPipelines
# pdf-lg:
#   meta:
#     title: "My Book (Large Print)"
#     fontSize: 18
#   stages:
#     - name: ejs
#       config:
#         rmWhitespace: false
#     - name: markdown
#     - name: themes
#     - name: largePrint
#       config:
#         lineSpacing: 1.5
`;
  fs.appendFileSync(bookConfigPath, pipelineSnippet, 'utf8');
  console.log(chalk.greenBright('Added commented-out pipeline example to book.config.yml.\n'));

  // 8. Wrap-up
  console.log(chalk.cyanBright(`All done! Next steps:`));
  console.log(chalk.cyanBright(`  1. cd ${projectName}`));
  console.log(chalk.cyanBright(`  2. git init && npm install`));
  console.log(chalk.cyanBright(`  3. bookpub build pdf`));
  console.log(chalk.cyanBright(`\nHappy Writing!\n`));
}

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @module newProject
 * @description
 * Scaffolds a new Bookpub project. This command prompts the user for basic project and book details,
 * then copies a complete example template—including a fully commented `book.config.yml`—into a new project folder.
 * The new project’s `book.config.yml` is loaded and updated with the user-specified values (e.g. book title,
 * author, subtitle, version) while preserving all comments and other configuration settings.
 *
 * @param {string} initialProjectName - The default project name.
 *
 * @example
 * // Create a new project named "my-book":
 * bookpub new my-book
 */
export async function newProject(initialProjectName) {
  // 1. Prompt the user for input
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project Name?',
      default: initialProjectName,
    },
    {
      type: 'input',
      name: 'bookTitle',
      message: 'Book Title?',
      default: 'Title',
    },
    {
      type: 'input',
      name: 'subTitle',
      message: 'Book Subtitle?',
      default: 'Subtitle',
    },
    {
      type: 'input',
      name: 'authorName',
      message: "Author's Name?",
      default: 'My Name',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description?',
      default: 'My great description',
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version/Edition?',
      default: '1.0',
    },
    {
      type: 'input',
      name: 'bookTemplateGitUrl',
      message: 'Custom book template URL (optional)? (git clone URL)',
      default: '',
    },
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

  // 3. Decide on the source of our template
  let templateSource;
  let clonedTempPath = '';
  if (templateGitUrl) {
    console.log(chalk.blue(`Cloning book template from: ${templateGitUrl}`));
    clonedTempPath = path.join(__dirname, '../../temp-clone');
    fs.removeSync(clonedTempPath);
    const cloneResult = spawnSync('git', ['clone', templateGitUrl, clonedTempPath], {
      stdio: 'inherit',
    });
    if (cloneResult.status !== 0) {
      console.log(chalk.red('\nFailed to clone the Git repository. Aborting.\n'));
      process.exit(cloneResult.status || 1);
    }
    console.log(chalk.green('Git clone successful.\n'));
    templateSource = clonedTempPath;
  } else {
    // Use the built-in example-book template
    templateSource = path.join(__dirname, '../templates/example-book');
    console.log(chalk.green('Installing default example-book template...\n'));
  }

  // 4. Copy the template to the project folder
  try {
    await fs.copy(templateSource, projectPath);
  } catch (err) {
    console.log(chalk.red(`\nError copying template: ${err.message}\n`));
    process.exit(1);
  }
  if (clonedTempPath && fs.existsSync(clonedTempPath)) {
    fs.removeSync(clonedTempPath);
  }

  // 5. Update package.json
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
      url: '',
    };
  }
  const bookpubPackageJsonPath = path.join(__dirname, '../../package.json');
  const bookpubPackageJson = fs.readJsonSync(bookpubPackageJsonPath);
  const bookpubVersion = bookpubPackageJson.version || 'latest';
  packageJsonData.dependencies = packageJsonData.dependencies || {};
  packageJsonData.dependencies.bookpub = `^${bookpubVersion}`;
  fs.writeJsonSync(packageJsonPath, packageJsonData, { spaces: 2 });
  console.log(chalk.greenBright('package.json created/updated.\n'));

  // 6. Update or create book.config.yml preserving comments.
  // Use the default config file from the template.
  const bookConfigPath = path.join(projectPath, 'book.config.yml');
  let configText = fs.readFileSync(path.join(__dirname, '../templates/example-book/book.config.yml'), 'utf8');

  // Parse the configuration using the "yaml" library to preserve comments.
  const doc = YAML.parseDocument(configText);

  // Update the global.meta section with user input.
  const globalNode = doc.get('global');
  if (!globalNode) {
    throw new Error('Invalid configuration: missing "global" key.');
  }
  const metaNode = globalNode.get('meta');
  if (!metaNode) {
    throw new Error('Invalid configuration: missing "global.meta" key.');
  }
  metaNode.set('title', bookTitle);
  metaNode.set('author', authorName);
  metaNode.set('description', description);
  metaNode.set('version', version);
  metaNode.set('subtitle', subTitle);

  // Write the updated configuration back, preserving comments.
  fs.writeFileSync(bookConfigPath, doc.toString(), 'utf8');
  console.log(chalk.green('book.config.yml created/updated.\n'));

  // 7. Wrap-up message.
  console.log(chalk.cyanBright(`All done! Next steps:`));
  console.log(chalk.cyanBright(`  1. cd ${projectName}`));
  console.log(chalk.cyanBright(`  2. git init && npm install`));
  console.log(chalk.cyanBright(`  3. bookpub build html`));
  console.log(chalk.cyanBright(`\nHappy Writing!\n`));
}

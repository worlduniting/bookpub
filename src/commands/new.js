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
 * newProject()
 * Creates a new Bookpub project by prompting the user for:
 *  - Project Name (bp => both package.json & book.config.yml)
 *  - Book Title (b => book.config.yml)
 *  - Subtitle (b => book.config.yml)
 *  - Author's Name (bp => both)
 *  - Description (bp => both)
 *  - Version (bp => both)
 *  - Custom book template URL (optional)
 *    => If provided, we "git clone" that URL into a temporary folder
 *       and copy its contents instead of using the built-in example-book template
 */
export async function newProject(initialProjectName) {
  // 1. Prompt the user for input
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

  // Store final answers
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
    // If a custom template URL was provided, git clone it to a temp folder
    console.log(chalk.blue(`Cloning book template from: ${templateGitUrl}`));
    clonedTempPath = path.join(__dirname, '../../temp-clone'); // or any suitable temp location

    // Ensure we remove any old leftover temp folder
    fs.removeSync(clonedTempPath);

    // Clone into temp folder
    const cloneResult = spawnSync('git', ['clone', templateGitUrl, clonedTempPath], {
      stdio: 'inherit'
    });

    if (cloneResult.status !== 0) {
      console.log(chalk.red('\nFailed to clone the Git repository. Aborting.\n'));
      process.exit(cloneResult.status || 1);
    }
    console.log(chalk.green('Git clone successful.\n'));

    // We'll use the cloned folder as our template source
    templateSource = clonedTempPath;
  } else {
    // Otherwise, fall back to the built-in example-book template
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

  // If we cloned, optionally remove the clonedTempPath after copying
  if (clonedTempPath && fs.existsSync(clonedTempPath)) {
    fs.removeSync(clonedTempPath);
  }

  // 5. Prepare or update package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  let packageJsonData = {};

  const packageJsonExists = fs.existsSync(packageJsonPath);
  if (packageJsonExists) {
    // If there's a package.json in the template, read & update
    packageJsonData = await fs.readJson(packageJsonPath);
  }

  // Merge user inputs
  packageJsonData.name = projectName;
  packageJsonData.version = version;
  packageJsonData.description = description;
  packageJsonData.author = authorName;
  packageJsonData.license = packageJsonData.license || 'MIT'; // default
  if (!packageJsonData.repository) {
    packageJsonData.repository = {
      type: 'git',
      url: ''
    };
  }

  // We'll also ensure "bookpub" is in dependencies
  // We'll read the version from Bookpub's own package.json
  const bookpubPackageJsonPath = path.join(__dirname, '../../package.json');
  const bookpubPackageJson = fs.readJsonSync(bookpubPackageJsonPath);
  const bookpubVersion = bookpubPackageJson.version || 'latest';

  packageJsonData.dependencies = packageJsonData.dependencies || {};
  packageJsonData.dependencies.bookpub = `^${bookpubVersion}`;

  // Write it out
  fs.writeJsonSync(packageJsonPath, packageJsonData, { spaces: 2 });
  console.log(chalk.greenBright('package.json created/updated.\n'));

  // 6. Update or create book.config.yml
  const bookConfigPath = path.join(projectPath, 'book.config.yml');
  let bookConfigData = {};

  if (fs.existsSync(bookConfigPath)) {
    try {
      const existingConfigStr = fs.readFileSync(bookConfigPath, 'utf8');
      bookConfigData = yaml.load(existingConfigStr) || {};
    } catch (err) {
      console.log(chalk.red(`\nError reading existing book.config.yml: ${err.message}\n`));
      process.exit(1);
    }
  }

  bookConfigData.meta = bookConfigData.meta || {};
  bookConfigData.meta.title = bookTitle;
  bookConfigData.meta.subtitle = subTitle;
  bookConfigData.meta.author = authorName;
  bookConfigData.meta.version = version; // if you want to store version in config too
  bookConfigData.settings = bookConfigData.settings || {};
  bookConfigData.settings.entryfile = bookConfigData.settings.entryfile || 'index.md.ejs';

  fs.writeFileSync(bookConfigPath, yaml.dump(bookConfigData), 'utf8');
  console.log(chalk.green('book.config.yml created/updated.\n'));

  // 7. Append a commented-out pipeline snippet
  const pipelineSnippet = `
buildPipelines:
  html:
    meta:
      version: 2.1
      title: The HTML Title
  pdf:
    meta:
      version: 2.1
      title: The PDF Title

# You can define custom buildPipelines if you want
# buildPipelines:
#   pdf-lg:
#     meta:
#       title: "My Book (Large Print)"
#       fontSize: 18
#     stages:
#       - name: ejs
#       - name: markdown
#       - name: theme
#       - name: largePrint
#         config:
#           lineSpacing: 1.5
#
# Or you can override bookpub's core pipelines if you want
#   pdf:
#     - name: ejs
#     - name: markdown
#     - name: theme
#
# Remember to make sure there is a folder in stages/ for any custom stages you create
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

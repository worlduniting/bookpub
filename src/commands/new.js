import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * newProject()
 * - Called by "bookpub new <projectName>" or "create-bookpub-project <projectName>"
 * - Asks user questions, scaffolds a new BookPub project folder
 */
export async function newProject(projectName) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: "Project folder name?",
      default: projectName
    },
    {
      type: 'input',
      name: 'bookTitle',
      message: "Book title?",
      default: projectName
    },
    {
      type: 'input',
      name: 'subTitle',
      message: "Subtitle (optional)?"
    },
    {
      type: 'input',
      name: 'authorName',
      message: "Author's name?"
    },
    {
      type: 'input',
      name: 'bookDescription',
      message: "Brief description?"
    },
    {
      type: 'input',
      name: 'gitRepository',
      message: "Git repository URL (optional)?",
      default: `https://github.com/username/${projectName}`
    },
    {
      type: 'input',
      name: 'bookTemplateGitUrl',
      message: "Custom book template Git URL? (optional)",
    },
    {
      type: 'input',
      name: 'randomQuestion',
      message: "What's the airspeed velocity of an unladen swallow?",
      default: "African or European?"
    }
  ]);

  const finalProjectName = answers.projectName;
  const projectPath = path.resolve(process.cwd(), finalProjectName);

  // Ensure no existing folder conflicts
  if (fs.existsSync(projectPath)) {
    console.log(chalk.magentaBright(`\nA folder named "${finalProjectName}" already exists.\n`));
    process.exit(1);
  }

  // Create project folder
  await fs.ensureDir(projectPath);
  console.log(`\nCreating new project folder: ${chalk.yellowBright(finalProjectName)}`);

  // Prepare or update package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJsonExists = fs.existsSync(packageJsonPath);

  // Read version from this package's own package.json
  const bookpubPackageJson = await fs.readJson(path.join(__dirname, '../../package.json'));
  const bookpubVersion = bookpubPackageJson.version || 'latest';

  let packageJsonData = {};
  if (packageJsonExists) {
    packageJsonData = await fs.readJson(packageJsonPath);
    packageJsonData.name = answers.bookTitle;
    packageJsonData.version = packageJsonData.version || '0.1.0';
    packageJsonData.description = answers.bookDescription || '';
    packageJsonData.repository = { type: 'git', url: answers.gitRepository };
    packageJsonData.dependencies = {
      ...packageJsonData.dependencies,
      bookpub: `^${bookpubVersion}`
    };
  } else {
    packageJsonData = {
      name: finalProjectName,
      version: '0.1.0',
      description: answers.bookDescription || '',
      author: answers.authorName || '',
      repository: {
        type: 'git',
        url: answers.gitRepository
      },
      dependencies: {
        bookpub: `^${bookpubVersion}`
      }
    };
  }

  // Write new or updated package.json
  await fs.writeJson(packageJsonPath, packageJsonData, { spaces: 2 });
  console.log(chalk.greenBright('package.json created/updated.\n'));

  // Copy the default example-book template (unless user gave a custom Git URL)
  if (!answers.bookTemplateGitUrl) {
    const exampleBookSource = path.join(__dirname, '../templates/example-book');
    console.log(chalk.green('Installing default example-book template...\n'));
    await fs.copy(exampleBookSource, projectPath);
  } else {
    console.log(chalk.yellow('Custom template Git URL was provided — you could clone it here if you wish.\n'));
  }

  // Update or create book.config.yml
  const bookConfigPath = path.join(projectPath, 'book.config.yml');
  if (fs.existsSync(bookConfigPath)) {
    const existingConfigStr = fs.readFileSync(bookConfigPath, 'utf8');
    const existingConfig = yaml.load(existingConfigStr) || {};
    if (!existingConfig.meta) {
      existingConfig.meta = {};
    }
    existingConfig.meta.title = answers.bookTitle;
    existingConfig.meta.subtitle = answers.subTitle;
    existingConfig.meta.author = answers.authorName;
    fs.writeFileSync(bookConfigPath, yaml.dump(existingConfig), 'utf8');
    console.log(chalk.green('Updated existing book.config.yml\n'));
  } else {
    const newConfig = {
      meta: {
        title: answers.bookTitle,
        subtitle: answers.subTitle,
        author: answers.authorName
      },
      settings: {
        entryfile: 'index.md.ejs'
      }
    };
    fs.writeFileSync(bookConfigPath, yaml.dump(newConfig), 'utf8');
    console.log(chalk.green('Created a new book.config.yml\n'));
  }

  // Done!
  console.log(chalk.cyanBright(`Done! Next steps:`));
  console.log(chalk.cyanBright(`  1. cd ${finalProjectName}`));
  console.log(chalk.cyanBright(`  2. git init && npm install`));
  console.log(chalk.cyanBright(`  3. bookpub build pdf`));
  console.log(chalk.cyanBright(`\nHappy Writing!\n`));
}

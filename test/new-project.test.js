import chai from 'chai';
import chaiFs from 'chai-fs';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

chai.use(chaiFs);
const { expect } = chai;

describe('bookpub new command', function () {
  const TEST_PROJECT_NAME = 'test-project';

  before(function () {
    // Create a new project
    execSync(`node ./bin/bookpub.js new ${TEST_PROJECT_NAME}`, { stdio: 'inherit' });
  });

  after(function () {
    // Clean up
    fs.removeSync(TEST_PROJECT_NAME);
  });

  it('should create the project directory', function () {
    expect(TEST_PROJECT_NAME).to.be.a.directory();
  });

  it('should create package.json with correct settings', function () {
    const packageJson = fs.readJsonSync(path.join(TEST_PROJECT_NAME, 'package.json'));
    expect(packageJson.dependencies.bookpub).to.exist;
  });

  it('should create book.config.yml with correct settings', function () {
    const bookConfigPath = path.join(TEST_PROJECT_NAME, 'book.config.yml');
    expect(bookConfigPath).to.be.a.path();
    const bookConfig = yaml.load(fs.readFileSync(bookConfigPath, 'utf8'));
    expect(bookConfig.meta.title).to.equal(TEST_PROJECT_NAME);
  });
});

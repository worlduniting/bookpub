import chai from 'chai';
import chaiFs from 'chai-fs';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

chai.use(chaiFs);
const { expect } = chai;

describe('Create BookPub Project', function () {
    this.timeout(10000); // This might take some time, increase timeout

    before(function () {
        // Run your cli script before testing
        execSync('node ./bin/cli.js test-project');
    });

    after(function () {
        // Cleanup after tests
        fs.removeSync('test-project');
    });

    it('should create the project directory', function () {
        expect('test-project').to.be.a.directory().and.not.empty;
    });

    it('should create package.json with correct settings', function () {
        const packageJson = fs.readJsonSync(path.join('test-project', 'package.json'));
        expect(packageJson.name).to.equal('test-project');
        expect(packageJson.dependencies.bookpub).to.exist;
    });

    it('should create book.config.yml with correct settings', function () {
        const bookConfigPath = path.join('test-project', 'book.config.yml');
        expect(bookConfigPath).to.be.a.path();
        const bookConfigContent = fs.readFileSync(bookConfigPath, 'utf8');
        const bookConfig = yaml.load(bookConfigContent);
        expect(bookConfig.meta.title).to.equal('test-project');
    });

    // ... Add more tests as required
});

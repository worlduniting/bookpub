#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import child_process from 'child_process';

const questions = [
    {
        type: 'input',
        name: 'bookTitle',
        message: "What is your book's title?",
        default: 'my-book',
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
        message: "What's the git repository?",
    },
];

async function main() {
    try {
        // Get user input
        const answers = await inquirer.prompt(questions);

        // Create the project directory
        const projectPath = path.resolve(process.cwd(), answers.bookTitle);
        await fs.ensureDir(projectPath);

        // Create the package.json
        const packageJson = {
            name: answers.bookTitle,
            version: '0.1.0',
            description: answers.bookDescription,
            author: answers.authorName,
            repository: {
                type: 'git',
                url: answers.gitRepository,
            },
        };
        await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

        // Copy the example manuscript structure (assuming it is in a folder called 'example-manuscript')
        await fs.copy('example-manuscript', path.join(projectPath, 'manuscript'));

        // Initialize git repository
        child_process.execSync('git init', { cwd: projectPath });

        console.log('Project created successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();

// tests/cli.test.js
import execa from 'execa';
import path from 'path';

// Helper function to run the CLI command
async function runCli(args) {
    const cliPath = path.resolve(__dirname, '..', 'cli.js');
    return await execa('node', [cliPath, ...args], { all: true });
}

// Check CLI for basic functionality
describe('CLI', () => {
    // Check for help & all commands listed
    test('shows help information', async () => {
        const { all } = await runCli(['--help']);
        expect(all).toMatch(['/Usage:/', '/Commands:/', '/build \[options\]/', '/dev \[options\]/', '/new \[projectName\]/', '/lint/', '/help \[command\]/']);
    });

    // Check that it shows current version
    test('shows version', async () => {
        const { all } = await runCli(['--version']);
        expect(all).toMatch(/\d+\.\d+\.\d+/);
    });

    // Check that it throws error for unknown command
    test('throws error for invalid command', async () => {
        await expect(runCli(['invalid'])).rejects.toThrow(/error: unknown command/);
    });

    test('throws error for ')

    // Add more test cases for each command, option, and scenario
});

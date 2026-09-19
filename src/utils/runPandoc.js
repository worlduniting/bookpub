import { spawn } from 'node:child_process';

/** Run Pandoc without a shell, streaming input and preserving useful diagnostics. */
export function runPandoc(executable, args, { input = '', cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    const output = [];
    const diagnostics = [];
    child.stdout.on('data', chunk => output.push(chunk));
    child.stderr.on('data', chunk => diagnostics.push(chunk));
    child.on('error', error => reject(new Error(
      `Could not run Pandoc at "${executable}". Install Pandoc or set pandocPath in the stage configuration. ${error.message}`
    )));
    // A failed executable can close stdin before all input has been written.
    child.stdin.on('error', error => {
      if (error.code !== 'EPIPE') reject(error);
    });
    child.on('close', code => {
      const stderr = Buffer.concat(diagnostics).toString('utf8');
      if (code !== 0) {
        reject(new Error(`Pandoc failed (${code ?? 'terminated'}).\n${stderr.trim()}`));
      } else {
        if (stderr.trim()) console.warn(stderr.trim());
        resolve(Buffer.concat(output).toString('utf8'));
      }
    });
    child.stdin.end(input);
  });
}

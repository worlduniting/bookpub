import chalk from "chalk";
import path from "path";
import { spawn } from "child_process";
import chokidar from "chokidar";
import browserSync from "browser-sync";
import open from "open";
import express from "express";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
import { copyFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Delay (ms) to debounce rebuilds after file changes
const DEBOUNCE_MS = 5000;

/**
 * Run `bookpub build <type>` and return a promise.
 * @param {string} type
 * @returns {Promise<void>}
 */
function runBuild(type) {
  return new Promise((resolve, reject) => {
    const proc = spawn("bookpub", ["build", type], { stdio: "inherit" });
    proc.on("close", (code) => {
      code === 0
        ? resolve()
        : reject(new Error(`Build failed with code ${code}`));
    });
  });
}

/**
 * Copy dev/preview.html into the build output directory
 * @param {string} outputDir
 */
async function copyPreview(outputDir) {
  const src = path.join(process.cwd(), "dev", "preview.html");
  const dest = path.join(outputDir, "preview.html");
  try {
    await copyFile(src, dest);
    console.log(chalk.green("Copied preview.html to output directory."));
  } catch (err) {
    console.error(chalk.red("Failed to copy preview.html:"), err);
  }
}

/**
 * Development mode: serves and live-reloads build outputs.
 * - For PDF builds: copies preview.html into build/pdf/, serves build/pdf/ with Express+WebSocket,
 *   and reloads the iframe in-place without losing scroll position.
 * - For other builds: serves build/<type>/ via BrowserSync and reloads on changes.
 *
 * @param {string} buildType
 */
export async function dev(buildType) {
  if (!buildType) {
    console.error(
      chalk.red("Please specify a build type. Example: bookpub dev html")
    );
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), "build", buildType);
  const isPdf = buildType === "pdf" || buildType === "portfolio";

  console.log(chalk.blue(`Running initial build for "${buildType}"...`));
  try {
    await runBuild(buildType);
  } catch (err) {
    console.error(chalk.red(err.message));
    process.exit(1);
  }

  if (isPdf) {
    // Copy preview.html into build/pdf/
    await copyPreview(outputDir);

    const port = 3000;
    const app = express();
    // Serve build/<type>/ as the web root
    app.use(express.static(outputDir));

    const server = app.listen(port, () => {
      console.log(
        chalk.green(
          `PDF preview available at http://localhost:${port}/preview.html`
        )
      );
      open(`http://localhost:${port}/preview.html`).catch((e) =>
        console.error(chalk.red(e))
      );
    });
    const wss = new WebSocketServer({ server });

    // Watch manuscript, config, and preview template
    const watchPaths = [
      path.join(process.cwd(), "manuscript"),
      path.join(process.cwd(), "book.config.yml"),
      path.join(process.cwd(), "dev", "preview.html"),
    ];
    const watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true,
      persistent: true,
    });

    let rebuildTimer;
    watcher.on("all", (event, changedPath) => {
      console.log(chalk.yellow(`Change detected (${event}) at ${changedPath}. Scheduling rebuild in ${DEBOUNCE_MS}ms...`));
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(async () => {
        console.log(chalk.yellow("Debounced rebuild starting..."));
        try {
          await runBuild(buildType);
          await copyPreview(outputDir);
          console.log(chalk.green("PDF rebuild complete, notifying preview..."));
          wss.clients.forEach((client) => {
            if (client.readyState === 1) client.send("reload");
          });
        } catch (e) {
          console.error(chalk.red(`Rebuild error: ${e.message}`));
        }
      }, DEBOUNCE_MS);
    });

    console.log(chalk.blue("Watching for PDF & preview.html changes..."));
  } else {
    // BrowserSync server for other build types
    const bs = browserSync.create();
    bs.init(
      {
        server: outputDir,
        port: 3000,
        open: false,
        notify: false,
      },
      () => {
        console.log(
          chalk.green(`Serving "${buildType}" at http://localhost:3000`)
        );
        open(`http://localhost:3000`).catch((e) =>
          console.error(chalk.red(e))
        );
      }
    );

    const watchPaths = [
      path.join(process.cwd(), "manuscript"),
      path.join(process.cwd(), "book.config.yml"),
    ];
    const watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true,
      persistent: true,
    });

    let rebuildTimer;
    watcher.on("all", (event, changedPath) => {
      console.log(chalk.yellow(`Change detected (${event}) at ${changedPath}. Scheduling rebuild in ${DEBOUNCE_MS}ms...`));
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(async () => {
        console.log(chalk.yellow("Debounced rebuild starting..."));
        try {
          await runBuild(buildType);
          console.log(chalk.green("Rebuild complete, reloading browser..."));
          bs.reload();
        } catch (e) {
          console.error(chalk.red(`Rebuild error: ${e.message}`));
        }
      }, DEBOUNCE_MS);
    });

    console.log(chalk.blue("Watching for source changes..."));
  }
}

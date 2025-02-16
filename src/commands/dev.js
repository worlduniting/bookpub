import chalk from "chalk";
import path from "path";
import { spawn } from "child_process";
import chokidar from "chokidar";
import browserSync from "browser-sync";
import open from "open";

/**
 * @module dev
 * @description
 * Runs Bookpub in development mode with live reloading. Depending on the build type:
 *
 * - For build types other than "pdf": A BrowserSync server is started to serve the build output,
 *   and the default web browser opens the served URL (http://localhost:3000).
 *
 * - For the "pdf" build type: Instead of serving an HTML file, the generated PDF (book.pdf)
 *   in the build output is opened directly in the default PDF viewer or browser.
 *
 * In both cases, file watchers are set up to monitor changes in the manuscript and book.config.yml.
 * When changes are detected, Bookpub rebuilds the output and reloads the view (or reopens the PDF).
 *
 * @param {string} buildType - The build type to run in development mode (e.g., "html" or "pdf").
 *
 * @example
 * // Run development mode for HTML:
 * bookpub dev html
 *
 * // Run development mode for PDF:
 * bookpub dev pdf
 */
export async function dev(buildType) {
  if (!buildType) {
    console.log(
      chalk.red("Please specify a build type. Example: bookpub dev html")
    );
    process.exit(1);
  }

  const buildCommand = ["build", buildType];
  const buildDir = path.join(process.cwd(), "build", buildType);
  const servePath = buildDir;

  console.log(chalk.blue(`Running initial build for "${buildType}"...`));
  const buildProcess = spawn("bookpub", buildCommand, { stdio: "inherit" });

  buildProcess.on("close", (code) => {
    if (code !== 0) {
      console.log(chalk.red(`Build process exited with code ${code}.`));
      process.exit(code);
    } else {
      if (buildType === "pdf") {
        // For PDF builds, open the generated PDF file directly.
        const pdfFile = path.join(servePath, "book.pdf");
        console.log(chalk.green(`Opening PDF: ${pdfFile}`));
        open(pdfFile).catch((err) => {
          console.log(chalk.red("Failed to open PDF:", err));
        });
        // Set up a file watcher to rebuild on changes.
        setTimeout(() => {
          const watchPaths = [
            path.join(process.cwd(), "manuscript"),
            path.join(process.cwd(), "book.config.yml"),
          ];
          const watcher = chokidar.watch(watchPaths, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true,
          });
          const rebuild = () => {
            console.log(chalk.yellow("Changes detected. Rebuilding PDF..."));
            const rebuildProcess = spawn("bookpub", buildCommand, {
              stdio: "inherit",
            });
            rebuildProcess.on("close", (code) => {
              if (code !== 0) {
                console.log(
                  chalk.red(`Rebuild process exited with code ${code}.`)
                );
              } else {
                console.log(
                  chalk.green("Rebuild complete. Opening updated PDF...")
                );
                open(pdfFile).catch((err) => {
                  console.log(chalk.red("Failed to open PDF:", err));
                });
              }
            });
          };
          watcher.on("change", rebuild);
          watcher.on("add", rebuild);
          watcher.on("unlink", rebuild);
          console.log(
            chalk.blue("Watching for changes in manuscript and book.config.yml...")
          );
        }, 500);
      } else {
        // For non-PDF build types, serve using BrowserSync.
        const bs = browserSync.create();
        bs.init(
          {
            server: servePath,
            port: 3000,
            open: false,
            notify: false,
          },
          () => {
            console.log(
              chalk.green(`Serving "${buildType}" at http://localhost:3000`)
            );
            open("http://localhost:3000").catch((err) => {
              console.log(chalk.red("Failed to open browser:", err));
            });
          }
        );
        setTimeout(() => {
          const watchPaths = [
            path.join(process.cwd(), "manuscript"),
            path.join(process.cwd(), "book.config.yml"),
          ];
          const watcher = chokidar.watch(watchPaths, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true,
          });
          const rebuild = () => {
            console.log(chalk.yellow("Changes detected. Rebuilding..."));
            const rebuildProcess = spawn("bookpub", buildCommand, {
              stdio: "inherit",
            });
            rebuildProcess.on("close", (code) => {
              if (code !== 0) {
                console.log(
                  chalk.red(`Rebuild process exited with code ${code}.`)
                );
              } else {
                console.log(chalk.green("Rebuild complete. Reloading browser..."));
                bs.reload();
              }
            });
          };
          watcher.on("change", rebuild);
          watcher.on("add", rebuild);
          watcher.on("unlink", rebuild);
          console.log(
            chalk.blue("Watching for changes in manuscript and book.config.yml...")
          );
        }, 500);
      }
    }
  });
}

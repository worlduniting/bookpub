import chalk from "chalk";
import path from "path";
import { spawn } from "child_process";
import chokidar from "chokidar";
import browserSync from "browser-sync";
import open from "open";

export async function dev(buildType) {
  if (!buildType) {
    console.log(
      chalk.red("Please specify a build type. Example: bookpub dev html")
    );
    process.exit(1);
  }

  const buildCommand = ["build", buildType];
  const servePath = path.join(process.cwd(), "build", buildType);

  const bs = browserSync.create();

  console.log(chalk.blue(`Running initial build for "${buildType}"...`));
  const buildProcess = spawn("bookpub", buildCommand, { stdio: "inherit" });

  buildProcess.on("close", (code) => {
    if (code !== 0) {
      console.log(chalk.red(`Build process exited with code ${code}.`));
      process.exit(code);
    } else {
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

      // Delay watcher start until after first build completes
      setTimeout(() => {
        const watchPaths = [
          path.join(process.cwd(), "manuscript"),
          path.join(process.cwd(), "book.config.yml"),
        ];

        const watcher = chokidar.watch(watchPaths, {
          ignored: /(^|[\/\\])\../,
          persistent: true,
          ignoreInitial: true, // 👈 Key change
        });

        const rebuild = () => {
          console.log(chalk.yellow("Changes detected. Rebuilding..."));
          const rebuildProcess = spawn("bookpub", buildCommand, { stdio: "inherit" });

          rebuildProcess.on("close", (code) => {
            if (code !== 0) {
              console.log(chalk.red(`Rebuild process exited with code ${code}.`));
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
          chalk.blue(
            "Watching for changes in the manuscript folder and book.config.yml..."
          )
        );
      }, 500); // Small delay to ensure the initial build is fully settled
    }
  });
}
/**
 * @module build
 * @description
 * This module orchestrates the build process for a Bookpub project.
 * It performs the following steps:
 *
 * 1. Loads the `book.config.yml` configuration file from the current working directory.
 * 2. Retrieves the build pipeline configuration for the specified build type from `buildPipelines` in the config.
 * 3. Merges the global metadata from `global.meta` with any build-specific metadata from the pipeline configuration.
 * 4. For each stage defined in the pipeline, it merges any global stage settings (from `global.stages`)
 *    with the pipeline-specific overrides. Pipeline settings take precedence.
 * 5. Dynamically imports and executes each stage sequentially.
 *
 * Each stage receives three parameters:
 *   - manuscript: The current state of the manuscript.
 *   - globalConfig: An object with merged global metadata.
 *   - stageConfig: An object containing merged stage-specific settings (divided into `config` and `meta`).
 *
 * Note: No default pipelines exist in the core. The user must define all build pipelines in `book.config.yml`.
 *
 * If the configuration file or a build pipeline is missing, the process throws an error
 * along with an example configuration snippet to help the user get started.
 *
 * @example
 * // Run the build command for the 'html' build type:
 * bookpub build html
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import YAML from 'js-yaml';
import { importStage } from '../utils/importStage.js';

export async function build({ buildtype }) {
  try {
    // 1. Load configuration from book.config.yml
    const configPath = path.join(process.cwd(), 'book.config.yml');

    // If the config file doesn't exist, throw an error with a helpful example.
    if (!fs.existsSync(configPath)) {
      throw new Error(
        `No 'book.config.yml' file found in the current directory.\n` +
        `Please create one. For example:\n\n` +
        `--------------------------------------------------\n` +
        `global:\n` +
        `  meta:\n` +
        `    title: "My Book Title"\n` +
        `    author: "John Doe"\n` +
        `    version: "1.0"\n` +
        `  stages:\n` +
        `    - name: ejs\n` +
        `      config:\n` +
        `        entryfile: "index.md.ejs"\n\n` +
        `buildPipelines:\n` +
        `  html:\n` +
        `    meta:\n` +
        `      title: "HTML Build"\n` +
        `    stages:\n` +
        `      - name: ejs\n` +
        `      - name: markdown\n` +
        `      - name: theme\n` +
        `      - name: writeHtml\n` +
        `--------------------------------------------------\n`
      );
    }

    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = YAML.load(configFile) || {};

    // 2. Determine the chosen build type and retrieve the pipeline config
    const chosenBuildType = buildtype || 'html';
    const userPipelines = config.buildPipelines || {};
    const pipelineConfig = userPipelines[chosenBuildType] || {};

    //  If no pipeline defined for the chosen type, throw an error with an example.
    if (!pipelineConfig.stages) {
      throw new Error(
        `No build pipeline defined for build type "${chosenBuildType}" in 'book.config.yml'.\n` +
        `Please add a build pipeline. For example:\n\n` +
        `--------------------------------------------------\n` +
        `buildPipelines:\n` +
        `  ${chosenBuildType}:\n` +
        `    meta:\n` +
        `      title: "${chosenBuildType.toUpperCase()} Build"\n` +
        `    stages:\n` +
        `      - name: ejs\n` +
        `      - name: markdown\n` +
        `      - name: theme\n` +
        `      - name: writeHtml\n` +
        `--------------------------------------------------\n`
      );
    }

    // 3. Merge global meta with pipeline-specific meta
    const globalMeta = config.global?.meta || {};
    const pipelineMeta = pipelineConfig.meta || {};
    const mergedMeta = { ...globalMeta, ...pipelineMeta };

    // 4. Retrieve global stage settings (if any)
    const globalStages = config.global?.stages || [];

    // 5. Get the pipeline's stages from the config (no fallback defaults)
    const pipelineStages = pipelineConfig.stages;
    
    console.log(chalk.blue(`\nBuilding for: ${chosenBuildType}\n`));
    let manuscript = { content: null, buildType: chosenBuildType };

    // 6. Execute each stage sequentially
    for (const stageDef of pipelineStages) {
      const stageName = stageDef.name;
      const pipelineStageOverrides = {
        config: stageDef.config || {},
        meta: stageDef.meta || {}
      };

      // Find matching global stage settings for this stage, if any
      const globalStageOverride = globalStages.find(s => s.name === stageName) || {};

      // Merge global stage settings with pipeline overrides (pipeline settings win)
      const effectiveStageConfig = {
        config: { ...(globalStageOverride.config || {}), ...pipelineStageOverrides.config },
        meta: { ...(globalStageOverride.meta || {}), ...pipelineStageOverrides.meta }
      };

      console.log(chalk.green(`Running stage: `) + chalk.yellow(stageName) + chalk.green(`...`));

      const stageModule = await importStage(stageName);
      if (stageModule && typeof stageModule.run === 'function') {
        manuscript = await stageModule.run(manuscript, {
          stageConfig: effectiveStageConfig,
          globalConfig: { meta: mergedMeta }
        });
      } else {
        console.warn(chalk.yellow(`No 'run' function found for stage: ${stageName}. Skipping...`));
      }
    }

    console.log(chalk.green(`\n✅ Build pipeline complete!\n`));
    console.log(chalk.green(`Output is in "build/${chosenBuildType}" folder\n`));
  } catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
}

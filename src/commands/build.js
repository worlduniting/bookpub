/**
 * @module build
 * @description
 * This module orchestrates the build process for a Bookpub project.
 * It performs the following steps:
 * 
 * 1. Loads the `book.config.yml` configuration file from the current working directory.
 * 2. Extracts and merges global metadata from the `global.meta` section with
 *    pipeline-specific metadata from `buildPipelines[buildType].meta`.
 * 3. Extracts global stage settings from `global.stages` and merges these with
 *    any pipeline-specific stage overrides. Pipeline settings override global settings.
 * 4. Dynamically imports each stage module in the defined pipeline and executes its `run` method.
 * 5. The `run` method of each stage receives:
 *    - `manuscript`: the current manuscript object.
 *    - An object with two keys:
 *      - `globalConfig`: an object containing merged metadata.
 *      - `stageConfig`: an object containing merged stage-specific settings (split into `config` and `meta`).
 * 6. Logs progress and writes the final output to the corresponding build folder.
 *
 * @example
 * // Run the build command for the 'html' build type
 * bookpub build html
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import YAML from 'js-yaml';
import { defaultPipelines } from '../defaultPipelines.js';
import { importStage } from '../utils/importStage.js';

/**
 * Orchestrates the build process for a specified build type.
 *
 * @async
 * @function build
 * @param {Object} options - Options object.
 * @param {string} options.buildtype - The build type (e.g., 'html', 'pdf').
 */
export async function build({ buildtype }) {
  try {
    // 1. Load configuration from book.config.yml
    const configPath = path.join(process.cwd(), 'book.config.yml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = YAML.load(configFile) || {};

    // 2. Determine the chosen build type and extract pipeline config
    const chosenBuildType = buildtype || 'html';
    const userPipelines = config.buildPipelines || {};
    let pipelineConfig = userPipelines[chosenBuildType] || {};

    // 3. Merge global metadata with pipeline-specific metadata
    const globalMeta = config.global?.meta || {};
    const pipelineMeta = pipelineConfig.meta || {};
    const mergedMeta = { ...globalMeta, ...pipelineMeta };

    // 4. Load global stage settings if defined
    const globalStages = config.global?.stages || [];

    // 5. Determine pipeline stages from user config or defaults
    let pipelineStages = pipelineConfig.stages;
    if (!pipelineStages) {
      if (Array.isArray(defaultPipelines[chosenBuildType])) {
        pipelineStages = defaultPipelines[chosenBuildType];
      } else {
        pipelineStages = defaultPipelines[chosenBuildType]?.stages;
      }
    }
    if (!pipelineStages) {
      throw new Error(
        `No stages found for build type "${chosenBuildType}". Define stages in book.config.yml or ensure a defaultPipeline exists.`
      );
    }

    console.log(chalk.blue(`\nBuilding for: ${chosenBuildType}\n`));
    let manuscript = { content: null, buildType: chosenBuildType };

    // 6. Iterate over each stage in the pipeline and execute it
    for (const stageDef of pipelineStages) {
      const stageName = stageDef.name;

      // Extract pipeline-specific overrides for the stage (if any)
      const pipelineStageOverrides = {
        config: stageDef.config || {},
        meta: stageDef.meta || {}
      };

      // Find matching global stage settings by stage name
      const globalStageOverride = globalStages.find(s => s.name === stageName) || {};

      // Merge global and pipeline stage settings (pipeline overrides win)
      const effectiveStageConfig = {
        config: { ...(globalStageOverride.config || {}), ...pipelineStageOverrides.config },
        meta: { ...(globalStageOverride.meta || {}), ...pipelineStageOverrides.meta }
      };

      console.log(chalk.green(`Running stage: `) + chalk.yellow(stageName) + chalk.green(`...`));

      // Import the stage module (local override if exists, else built-in)
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

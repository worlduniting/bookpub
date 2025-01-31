import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import YAML from 'js-yaml';
import { defaultPipelines } from '../defaultPipelines.js';
import { importStage } from '../utils/importStage.js';

/**
 * Orchestrates the build process:
 * 1. Loads book.config.yml from the CWD
 * 2. Finds pipeline (user-defined or default)
 * 3. Merges meta
 * 4. Runs stages in sequence
 */
export async function build({ buildtype }) {
  try {
    const configPath = path.join(process.cwd(), 'book.config.yml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = YAML.load(configFile) || {};

    const chosenBuildType = buildtype || 'html';
    const userPipelines = config.buildPipelines || {};

    let pipelineConfig = userPipelines[chosenBuildType] || {};
    let pipelineMeta = pipelineConfig.meta || {};

    // Default to global meta if present
    const topLevelMeta = config.meta || {};
    const mergedMeta = { ...topLevelMeta, ...pipelineMeta };

    // Ensure meta.html exists and merge build-specific meta into it
    if (!mergedMeta.html) {
      mergedMeta.html = {};
    }
    mergedMeta.html.version = pipelineMeta.version || topLevelMeta.version || 'Unknown';

    // Extract user-defined stages or use defaultPipelines
    let pipelineStages = pipelineConfig.stages;

    if (!pipelineStages) {
      if (Array.isArray(defaultPipelines[chosenBuildType])) {
        pipelineStages = defaultPipelines[chosenBuildType]; // Use array directly
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

    for (const stageDef of pipelineStages) {
      const { name: stageName, config: stageStageConfig = {} } = stageDef;

      console.log(chalk.green(`Running stage: `) + chalk.yellow(stageName) + chalk.green(`...`));

      const stageModule = await importStage(stageName);
      if (stageModule && typeof stageModule.run === 'function') {
        manuscript = await stageModule.run(manuscript, {
          stageConfig: stageStageConfig,
          globalConfig: {
            ...config,
            meta: mergedMeta
          }
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

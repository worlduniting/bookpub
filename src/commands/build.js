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

    const chosenBuildType = buildtype || 'pdf';
    const userPipelines = config.buildPipelines || {};

    let pipelineConfig = userPipelines[chosenBuildType];
    if (!pipelineConfig) {
      pipelineConfig = defaultPipelines[chosenBuildType];
    }

    if (!pipelineConfig) {
      throw new Error(`No pipeline found for build type "${chosenBuildType}".`);
    }

    console.log(chalk.blue(`\nBuilding for: ${chosenBuildType}\n`));

    let pipelineMeta = {};
    let pipelineStages = [];

    if (Array.isArray(pipelineConfig)) {
      pipelineStages = pipelineConfig;
    } else {
      pipelineMeta = pipelineConfig.meta || {};
      pipelineStages = pipelineConfig.stages || [];
    }

    const topLevelMeta = config.meta || {};
    const mergedMeta = { ...topLevelMeta, ...pipelineMeta };

    let manuscript = { content: null, buildType: chosenBuildType };

    for (const stageDef of pipelineStages) {
      const { name: stageName, config: stageStageConfig = {} } = stageDef;

      console.log(chalk.green(`Running stage: ${stageName}...`));

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

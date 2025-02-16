import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fse from 'fs-extra';
import YAML from 'js-yaml';
import { importStage } from '../utils/importStage.js';

/**
 * @module build
 * @description
 * This module orchestrates the build process for a Bookpub project.
 * It loads the book.config.yml file and validates that meta is defined only in allowed locations:
 *   - global.meta
 *   - buildPipelines.[buildType].meta
 *
 * Meta defined anywhere else (e.g. in stage definitions) is not allowed.
 *
 * The precedence for meta is as follows:
 *   1. global.meta (lowest)
 *   2. buildPipelines.[buildType].meta (overrides global.meta)
 *
 * You can build a single pipeline (e.g., "html") or build all pipelines by passing "all".
 *
 * @example
 * // Build only the HTML pipeline:
 * bookpub build html
 *
 * // Build all pipelines defined in book.config.yml:
 * bookpub build all
 */
export async function build({ buildtype }) {
  try {
    const configPath = path.join(process.cwd(), 'book.config.yml');
    if (!fs.existsSync(configPath)) {
      throw new Error(
        `No 'book.config.yml' file found in the current directory.\n` +
          `Please create one. For example:\n\n` +
          `--------------------------------------------------\n` +
          `global:\n` +
          `  meta:\n` +
          `    title: "My Book Title"\n` +
          `    author: "John Doe"\n` +
          `  stages:\n` +
          `    - name: ejs\n` +
          `      config: { }\n\n` +
          `buildPipelines:\n` +
          `  html:\n` +
          `    meta:\n` +
          `      title: "HTML Build"\n` +
          `    stages:\n` +
          `      - name: ejs\n` +
          `      - name: markdown\n` +
          `      - name: themes\n` +
          `        config:\n` +
          `          name: "default"\n` +
          `      - name: writeHtml\n` +
          `--------------------------------------------------\n`
      );
    }
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = YAML.load(configFile) || {};

    // --- Validate meta placement ---
    // In global, only "meta" is allowed at global level; stages cannot include meta.
    if (config.global && config.global.stages) {
      config.global.stages.forEach((stage) => {
        if (stage.meta !== undefined) {
          throw new Error(
            `Invalid configuration: meta is only allowed under global.meta, not in global.stages for stage "${stage.name}".`
          );
        }
      });
    }
    // In buildPipelines, meta is only allowed directly under the pipeline,
    // not inside the stages array.
    if (config.buildPipelines) {
      Object.keys(config.buildPipelines).forEach((bt) => {
        const pipeline = config.buildPipelines[bt];
        if (pipeline.stages) {
          pipeline.stages.forEach((stage) => {
            if (stage.meta !== undefined) {
              throw new Error(
                `Invalid configuration: meta is only allowed under buildPipelines.${bt}.meta, not in stages for stage "${stage.name}".`
              );
            }
          });
        }
      });
    }
    // --- End Validation ---

    if (buildtype === 'all') {
      const pipelines = config.buildPipelines || {};
      if (Object.keys(pipelines).length === 0) {
        throw new Error('No build pipelines defined in book.config.yml.');
      }
      for (const key of Object.keys(pipelines)) {
        console.log(chalk.blue(`\n========== Building pipeline: ${key} ==========\n`));
        await runPipeline(key, config);
      }
    } else {
      const chosenBuildType = buildtype || 'html';
      await runPipeline(chosenBuildType, config);
    }
  } catch (err) {
    console.error(chalk.red(err));
    process.exit(1);
  }
}

/**
 * Runs the build pipeline for the specified build type.
 *
 * @param {string} chosenBuildType - The build type (e.g., "html", "pdf").
 * @param {Object} config - The loaded book.config.yml configuration.
 */
async function runPipeline(chosenBuildType, config) {
  // Retrieve the pipeline configuration for the chosen build type.
  const userPipelines = config.buildPipelines || {};
  const pipelineConfig = userPipelines[chosenBuildType] || {};

  if (!pipelineConfig.stages) {
    throw new Error(
      `No stages defined for build type "${chosenBuildType}" in book.config.yml.\n` +
        `Please define a build pipeline.`
    );
  }

  // Wipe clean the build directory.
  const buildDir = path.join(process.cwd(), 'build', chosenBuildType);
  fse.emptyDirSync(buildDir);

  // Merge meta: global.meta is overridden by buildPipelines.[buildType].meta.
  const globalMeta = config.global?.meta || {};
  const pipelineMeta = pipelineConfig.meta || {};
  const mergedMeta = { ...globalMeta, ...pipelineMeta };

  // Retrieve global stage settings (if any).
  // (We no longer allow meta in stage definitions, so only consider config.)
  const globalStages = config.global?.stages || [];

  const pipelineStages = pipelineConfig.stages;

  console.log(chalk.blue(`\nBuilding for: ${chosenBuildType}\n`));
  let manuscript = { content: null, buildType: chosenBuildType };

  // Execute each stage sequentially.
  for (const stageDef of pipelineStages) {
    const stageName = stageDef.name;
    // Since meta is not allowed in stage definitions, we check:
    if (stageDef.meta !== undefined) {
      throw new Error(
        `Invalid configuration: meta is only allowed under buildPipelines.${chosenBuildType}.meta, not in stage "${stageName}".`
      );
    }
    const pipelineStageOverrides = { config: stageDef.config || {} };

    // Look up matching global stage settings, if any.
    const globalStageOverride = globalStages.find((s) => s.name === stageName) || {};
    if (globalStageOverride.meta !== undefined) {
      throw new Error(
        `Invalid configuration: meta is only allowed under global.meta, not in global.stages for stage "${stageName}".`
      );
    }
    const effectiveStageConfig = {
      config: { ...(globalStageOverride.config || {}), ...pipelineStageOverrides.config }
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

  console.log(chalk.green(`\n✅ Build pipeline complete for ${chosenBuildType}!\n`));
  console.log(chalk.green(`Output is in "build/${chosenBuildType}" folder\n`));
}

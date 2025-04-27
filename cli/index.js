#!/usr/bin/env node

// import { intro, outro, text, select, multiselect, confirm, spinner, tasks, stream } from '@clack/prompts';
import * as prompts from '@clack/prompts';
import fs from 'fs';
import { spawn, spawnSync } from 'child_process';
import config from '../config/modules.json' with { "type": "json" }
import defaultOptions from '../config/defaults.json' with { type: 'json' }
import patternsConfig from '../.patterns/backpack/.config/templates.json' with { "type": "json" }
import projectPackageJSON from '../package.json' with { type: 'json' }
import color from 'picocolors'
import path, { dirname } from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const state = {
  projectName: '',
  version: '',
  useDDEV: true,
  promptForModules: true,
  modules: [],
  usePatterns: false,
  patternsPack: '',
  patterns: {
    layouts: [],
    blocks: [],
    includes: [],
  },
  extras: [],
  allowPlugins: false,

  projectDir: '',
};

const FEATURE_FLAGS = [
  'recommended',
  'blank',
  'cypress',
  'phpunit',
  'standards',
  'prettier',
  'linter'
];

const OPTIONS = [
  'help',
  'version'
]

const helpMessage = `
Usage: backpack-start [FLAGS...] [OPTIONS...]
Create Silverstripe project from the backpack installer

Options:
  --help
    Display this message
  --version
    Display the version and package name

Flags:
  --recommended
    Installs a 'recommended' set of modules and configurations.
    It does not prompt you to install these

  --blank
  Unlike the recommended flag, this will ask you which feature flags you want to add
  
  --standards
    Include bespoke-standards in the project

  --cypress
    Include cypress in the project

  --phpunit
    Include phpunit in the project

  --prettier
    Include prettier in the project
`;

const cancel = () => prompts.cancel('Operation cancelled')

function addOutput(outputStream, resolve) {
  outputStream.stdout.on('data', data => {
    prompts.stream.info(data.toString());
  });
  outputStream.stderr.on('data', (data) => {
    prompts.stream.info(data.toString());
  });
  
  outputStream.on('close', (code) => {
    if (code !== 0) {
      prompts.outro('Setup cancelled. Goodbye!')
      process.exit(1)
    }
    resolve();
  });

  return outputStream;
}

const installProject = async () => {
  return new Promise((resolve, reject) => {
    console.log(color.blue(`Running: composer create-project silverstripe/installer ${state.projectName}`))
    const installProject = spawn('composer', ['create-project', 'silverstripe/installer', state.projectName], { cwd: state.projectDir });
    addOutput(installProject, resolve);
  })
}

const setupDDEV = async () => {
  return new Promise((resolve, reject) => {
    console.log(color.blue(`Running: ddev config --project-type=silverstripe --docroot=public`))
    const ddevCommand = spawn('ddev', ['config', '--project-type=silverstripe', '--docroot=public'], { cwd: state.projectDir });
    addOutput(ddevCommand, resolve);
  })
}

const allowPlugins = async () => {
  return new Promise((resolve, reject) => {
    console.log(color.blue(`Running: composer config --no-plugins allow-plugins ${state.allowPlugins}`))
    const allowPlugins = spawn('composer', ['config', '--no-plugins', 'allow-plugins', state.allowPlugins], { cwd: state.projectDir });
    addOutput(allowPlugins, resolve);
  })
};

// installs the modules 
const installModules = async () => {
  return new Promise((resolve, reject) => {
    console.log(color.blue(`Running: composer require ${state.modules.join(' ')}`))
    const installModules = spawn('composer', ['require', ...state.modules], { cwd: state.projectDir });
    addOutput(installModules, resolve);
  })
}

const applyPatterns = async () => {
  const patternsDirectory = path.resolve(__dirname, '..', '.patterns');
  const { paths } = defaultOptions;

  state.patterns.layouts.forEach(layout => {
    console.log(patternsDirectory, layout);
    const layoutDir = path.join(patternsDirectory, layout);
    const layoutItems = fs.readdirSync(layoutDir);
    layoutItems.forEach(fileName => {
      let { name, ext, base } = path.parse(fileName);
      ext = ext.substring(1);

      console.log(paths, ext);
      if (paths[ext]) {
        const copyToDirectory = path.resolve(__dirname, '..', `${state.projectDir}/`, paths[ext], name).trim();
        console.log(copyToDirectory);
        if (!fs.existsSync(copyToDirectory)) {
          fs.mkdirSync(copyToDirectory);
        }

        fs.copyFile(path.join(layoutDir, base), path.join(copyToDirectory, base), (err) => {
          if (err) throw err;
          console.log(`${name}.txt was copied`);
        });
      }
    });
  });
}

async function main() {
  const cwd = process.cwd()
  const args = process.argv.slice(2)

  const flags = [...FEATURE_FLAGS, ...OPTIONS];
  const options = Object.fromEntries(flags.map((key) => [key, { type: 'boolean' }]))

  const { values: argv, positionals } = parseArgs({
    args,
    options,
    strict: true,
    allowPositionals: true,
  })

  if (argv.help) {
    console.log(helpMessage)
    process.exit(0)
  }

  if (argv.version) {
    console.log(`${projectPackageJSON.name} v${projectPackageJSON.version}`)
    process.exit(0)
  }

  prompts.intro(color.blue('Welcome to the Silverstripe Backpack'))
  console.log('Jump start a Silverstripe project within a few clicks\n')

  console.log(color.blue('\n1. The basics'))
  state.projectName = await prompts.text({
    message: 'What is the name of your project?',
    placeholder: 'my-website',
    validate: (value) => {
      if (!value) return 'Project name is required'
      if (!/^[a-z0-9-~/]+$/.test(value))
        return 'Project name can only contain lowercase letters, numbers, and dashes'
      return undefined
    },
  })

  if (state.projectName === null) {
    prompts.outro('Setup cancelled!')
    process.exit(0)
  }

  state.projectDir = await prompts.text({
    message: 'Which directory do you want this project reside?',
    placeholder: '/',
  })

  if (state.projectDir === null || fs.existsSync(state.projectDir)) {
    prompts.outro(color.red('Directory already exists. Please choose a different name.'))
    process.exit(0)
  }

  // create the project path
  let projectPath = state.projectDir ?? '';
  if (projectPath.startsWith('~/')) {
    state.projectDir = path.join(os.homedir(), projectPath.slice(2));
  }
  else {
    // if the user has not provided a path, use the root directory of this project
    state.projectDir = path.resolve(__dirname, '..', '.exported_projects');
  }

  console.log(color.blue('\nPick a version'))
  const versionOptions = config.versions.map((mod) => ({
    value: mod.name,
    label: mod.name,
    hint: mod.description,
  }));

  if (prompts.isCancel(versionOptions)) return cancel();
  
  state.version = await prompts.select({
    message: 'Which version of Silverstripe do you want to target',
    options: [
      ...versionOptions,
    ],
    required: true,
  });

  state.usePresets = await prompts.select({
    message: 'Do you want to use a preset?',
    options: [
      { value: false, label: 'No', hint: 'Does not use a preset' },
      { value: 'recommended', label: 'Use recommended', hint: '' },
    ],
  })

  if (argv.recommended || state.usePresets === 'recommended') {
    console.log(color.yellow('Will install the recommended modules and configurations.'))

    state.promptForModules = await prompts.select({
      message: 'Do you want to run through the prompts, or jump into installing the project?',
      options: [
        { value: true, label: 'Continue through prompts', hint: 'Asks you to pick modules and extra prompts' },
        { value: false, label: 'Install project', hint: 'Skips the modules, and extra prompts and installs the project' },
      ],
      required: true,
    });

    // if the user selects to 'Install project' set the recommended configuration
    if (!state.promptForModules) {
      const recommendedModules = config.presets.recommended.modules
      state.modules = recommendedModules;
      state.allowPlugins = true;
      state.useDDEV = true;
    }
  }

  if (state.promptForModules) {
    state.useDDEV = await prompts.select({
      message: 'Do you want to use DDEV?',
      options: [
        { value: true, label: 'Yes', hint: 'Use DDEV' },
        { value: false, label: 'No', hint: 'Self manage the environment yourself (native, vagrant etc)' },
      ],
      required: true,
    });

    console.log(color.blue('\nPick modules'))
    const moduleOptions = config.modules.map((mod) => ({
      value: mod.name,
      label: mod.name,
      hint: mod.description,
    }))

    state.modules = await prompts.multiselect({
      message: 'Select the modules you want to install',
      options: [
        ...moduleOptions,
      ],
      required: true,
    })
  
    if (state.modules === null) {
      prompts.outro('Setup cancelled. Goodbye!')
      process.exit(0)
    }
  
    state.allowPlugins = await prompts.confirm({
      message: `Allow composer plugins?`,
      required: true,
    });

    state.usePatterns = await prompts.confirm({
      message: `Do you want to use any patterns?`,
      required: true,
    });

    if (state.usePatterns) {
      const layoutOptions = patternsConfig.layouts.map((mod) => ({
        value: mod.location,
        label: mod.name,
        hint: mod.description,
      }));

      state.patterns.layouts = await prompts.multiselect({
        message: 'Select page layouts to include.',
        options: [
          ...layoutOptions,
        ],
        required: true,
      })
    }
  }

  console.log(color.blue('\n' + 'Project summary:'))
  console.log(`Project name: ${color.bold(state.projectName)}`)
  console.log(`Directory: ${color.bold(state.projectDir)}`)
  console.log(`Using DDEV: ${color.bold(state.useDDEV ? 'Yes' : 'No')}`)
  console.log(`Version: ${color.bold(state.version)}`)
  console.log(`Modules: ${color.bold(state.modules.join(', '))}`)
  
  const shouldProceed = await prompts.confirm({
    message: `Ready to create your Silverstripe project "${state.projectName}"?`,
  });
  

  if (!shouldProceed) {
    prompts.outro('Setup cancelled. Goodbye!')
    process.exit(0)
  }

  console.log(color.blue(`Creating directory at ${state.projectDir}`))

  if (!fs.existsSync(state.projectDir)){
    fs.mkdirSync(state.projectDir);
  }
 
  await installProject();
  state.projectDir = path.join(state.projectDir, state.projectName);
  if (state.useDDEV) {
    await setupDDEV();
  }

  await allowPlugins();
  await installModules();

  if (state.usePatterns) {
    await applyPatterns();
  }

  // Final instructions
  prompts.outro(`${color.green('Success!')} Your Silverstripe project is ready.`)
  console.log(`\nNext steps: ...`)
}

main().catch(console.error)

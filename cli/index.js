#!/usr/bin/env node

import { intro, outro, text, select, multiselect, confirm, spinner } from '@clack/prompts'
import fs from 'fs';
import { spawn } from 'child_process';
import config from '../config/modules.json' with { "type": "json" }
import color from 'picocolors'

const state = {
  projectName: '',
  version: '',
  modules: [],
  extras: [],
  allowPlugins: false,
};

async function main() {
  // Welcome/Intro
  intro(color.blue('Welcome to the Silverstripe Backpack'))
  console.log('Jump start a Silverstripe project within a few clicks\n')

  // Step 1: Basics
  console.log(color.blue('\n1. The basics'))
  state.projectName = await text({
    message: 'What is the name of your project?',
    placeholder: 'my-silverstripe-project',
    validate: (value) => {
      if (!value) return 'Project name is required'
      if (!/^[a-z0-9-]+$/.test(value))
        return 'Project name can only contain lowercase letters, numbers, and dashes'
      return undefined
    },
  })

  if (state.projectName === null) {
    outro('Setup cancelled. Goodbye!')
    process.exit(0)
  }

  state.projectDir = await text({
    message: 'Where do you want the project to live?',
    placeholder: '/',
    validate: (value) => {
      if (!value) return 'Project name is required'
      // if (!/^[a-z0-9-]+$/.test(value))
      //   return 'Project name can only contain lowercase letters, numbers, and dashes'
      return undefined
    },
  })
  
  if (state.projectDir === null || fs.existsSync(state.projectDir)) {
    outro(color.red('Directory already exists. Please choose a different name.'))
    process.exit(0)
  }

  console.log(color.blue('\n2. Pick a version'))
  const versionOptions = config.versions.map((mod) => ({
    value: mod.name,
    label: mod.name,
    hint: mod.description,
  }))
  state.version = await select({
    message: 'Which version of Silverstripe do you want to target',
    options: [
      ...versionOptions,
    ],
    required: true,
  })

  // Step 2: Modules
  console.log(color.blue('\n2. Pick modules'))
  const moduleOptions = config.modules.map((mod) => ({
    value: mod.name,
    label: mod.name,
    hint: mod.description,
  }))
  state.modules = await multiselect({
    message: 'Select the modules you want to install',
    options: [
      ...moduleOptions,
    ],
    required: true,
  })

  if (state.modules === null) {
    outro('Setup cancelled. Goodbye!')
    process.exit(0)
  }

  state.allowPlugins = await select({
    message: 'Allow composer plugins?',
    options: [
      { value: 'yes', label: 'Yes', hint: 'Allow plugins' },
      { value: 'no', label: 'No', hint: 'Do not allow plugins' },
    ],
    required: true,
  })

  // Step 4: Confirmation & Creation
  const shouldProceed = await confirm({
    message: `Ready to create your Silverstripe project "${state.projectName}"?`,
  })

  if (!shouldProceed) {
    outro('Setup cancelled. Goodbye!')
    process.exit(0)
  }

  // Final step - creating the project
  const s = spinner()
  s.start('Creating your Silverstripe project')

  // Simulate project creation with timeout
  await new Promise((resolve) => {
    fs.mkdirSync(state.projectDir, { recursive: true })

    const installProject = spawn('composer', ['create-project', 'silverstripe/installer', state.projectName]);
    installProject.stdout.on('data',  data => {
      console.log(data.toString());
    });
    installProject.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    installProject.on('close', (code) => {
      if (code !== 0) {
        s.stop(color.red('Failed to create project'))
        outro('Setup cancelled. Goodbye!')
        process.exit(1)
      }


      const allowPlugins = spawn('composer', ['config', '--no-plugins', 'allow-plugins', state.allowPlugins], { cwd: state.projectDir });
      allowPlugins.stdout.on('data',  data => {
        console.log(data.toString());
      });
      allowPlugins.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      // Install modules
      const installModules = spawn('composer', ['require', ...state.modules], { cwd: state.projectDir });
      installModules.stdout.on('data',  data => {
        console.log(data.toString());
      });
      installModules.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      installModules.on('close', (code) => {
        if (code !== 0) {
          s.stop(color.red('Failed to create project'))
          outro('Setup cancelled. Goodbye!')
          process.exit(1)
        }
      });
      s.stop(color.green('Project created successfully!'))
      resolve();
    });
  })


  s.stop('Project created successfully!')

  // Output summary
  console.log('\n' + color.green('✓') + ' Project summary:')
  console.log(`  Name: ${color.bold(state.projectName)}`)
  console.log(`  Version: ${color.bold(state.version)}`)
  console.log(`  Modules: ${color.bold(state.modules.join(', '))}`)
  // if (extras.length > 0) {
  //   console.log(`  Extras: ${color.bold(extras.join(', '))}`)
  // }

  // Final instructions
  outro(`${color.green('Success!')} Your Silverstripe project is ready.`)
  console.log(`\nNext steps:
  ${color.cyan('cd')} ${state.projectDir}
  ${color.cyan('npm install')}
  ${color.cyan('npm run dev')}`)
}

main().catch(console.error)

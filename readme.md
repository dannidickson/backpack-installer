# 🎒 Backpack

## 💡 About
Backpack: a **local-only** Silverstripe setup tool. With the focus on jumpstarting you into a Silverstripe project.

## 🛠️ Usage
To create a new project using Backpack. 
1. Clone the repo somewhere on your machine
```
git clone git@github.com:dannidickson/backpack-installer.git backpack
```
2. Move into backpack and install the node modules. 
```
cd backpack
npm install
```
3. After that you can run the project. You have two options, the interactive web instance, or the command line.
For most users we recommend the command line. The web GUI is experimental and may not stay around.

CLI: 
```
npx backpack-start
```
Web instance:
```
npm run serve
```

> [!WARNING]
> Do not include backpack code as part of a project. You should always be creating the project in a different directory, or moving the project from outside of the `.exported_projects` directory.
> `backpack.config.js` is fine to include in the project. 

## Web instance
When running the web instance it will take you though the same experience in the CLI, its just a more visual way. This is an experiment and may not stay around.

### How it works
As you go through the prompts / questions it will store the answers. At the end of the setup you will be asked if it can create the project for you. It will also provide you a sha256 hash that you can paste into the terminal with the data. This looks like `npx backpack-start b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9`

If you choose to create the project, it will process the commands via the node-script. This will only run at the end of the setup, and only if you say it can.

> [!NOTE]
> When using the CLI, it will always process and run the commands at the end. Its implied by using the CLI that you give us that permission. But we do show and provide warnings if a project already exists.

## 🫂 Want to contribute?

Whilst the majority of this project has been developed and built by the Silverhawks from Silverstripe LTD. We've built this to be an open source package, using some of our patterns and standards

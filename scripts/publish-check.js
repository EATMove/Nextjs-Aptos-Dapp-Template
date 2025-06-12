#!/usr/bin/env node

import fs from 'fs-extra';
import chalk from 'chalk';

console.log(chalk.blue('🔍 Pre-publish checks...'));

// Check if all required files exist
const requiredFiles = [
  'bin/generate.js',
  'template/package.json',
  'template/README.md',
  'template/env.example',
  'README.md'
];

let allFilesExist = true;

for (const file of requiredFiles) {
  if (await fs.pathExists(file)) {
    console.log(chalk.green(`✅ ${file}`));
  } else {
    console.log(chalk.red(`❌ ${file} - Missing!`));
    allFilesExist = false;
  }
}

// Check template structure
const templateDirs = [
  'template/app',
  'template/components',
  'template/contracts',
  'template/hooks',
  'template/utils'
];

for (const dir of templateDirs) {
  if (await fs.pathExists(dir)) {
    console.log(chalk.green(`✅ ${dir}/`));
  } else {
    console.log(chalk.red(`❌ ${dir}/ - Missing!`));
    allFilesExist = false;
  }
}

// Check package.json
const packageJson = await fs.readJson('package.json');
console.log(chalk.blue('\n📦 Package info:'));
console.log(chalk.cyan(`   Name: ${packageJson.name}`));
console.log(chalk.cyan(`   Version: ${packageJson.version}`));
console.log(chalk.cyan(`   Description: ${packageJson.description}`));

if (allFilesExist) {
  console.log(chalk.green('\n🎉 All checks passed! Ready to publish.'));
} else {
  console.log(chalk.red('\n❌ Some files are missing. Please fix before publishing.'));
  process.exit(1);
}

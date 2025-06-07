#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateProject() {
  console.log(chalk.blue('🚀 Welcome to Nextjs Aptos dApp Template Generator!'));
  console.log(chalk.gray('This tool will help you create a modern Aptos dApp with Next.js\n'));

  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: 'my-aptos-dapp',
      validate: (input) => {
        if (!input.trim()) {
          return 'Project name cannot be empty';
        }
        if (!/^[a-z0-9-_]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'network',
      message: 'Which Aptos network do you want to use?',
      choices: [
        { name: 'Devnet (Development)', value: 'devnet' },
        { name: 'Testnet (Testing)', value: 'testnet' },
        { name: 'Mainnet (Production)', value: 'mainnet' }
      ],
      default: 'devnet'
    }
  ];

  const answers = await inquirer.prompt(questions);
  const templateDir = path.join(__dirname, '..', 'template');
  const targetDir = path.join(process.cwd(), answers.projectName);

  try {
    // Check if directory already exists
    if (await fs.pathExists(targetDir)) {
      console.error(chalk.red(`❌ Error: Directory ${answers.projectName} already exists.`));
      process.exit(1);
    }

    console.log(chalk.yellow('📁 Creating project directory...'));
    // Copy template to target directory
    await fs.copy(templateDir, targetDir);
    console.log(chalk.green(`✅ Created project directory: ${targetDir}`));

    // Update package.json
    console.log(chalk.yellow('📝 Updating package.json...'));
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = answers.projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    console.log(chalk.green('✅ Updated package.json'));

    // Create .env file
    console.log(chalk.yellow('🔧 Creating .env file...'));
    const envPath = path.join(targetDir, '.env');

    // Configure network URLs based on selection
    let nodeUrl, faucetUrl;
    switch (answers.network) {
      case 'mainnet':
        nodeUrl = 'https://fullnode.mainnet.aptoslabs.com/v1';
        faucetUrl = '';
        break;
      case 'testnet':
        nodeUrl = 'https://fullnode.testnet.aptoslabs.com/v1';
        faucetUrl = 'https://faucet.testnet.aptoslabs.com';
        break;
      case 'devnet':
      default:
        nodeUrl = 'https://fullnode.devnet.aptoslabs.com/v1';
        faucetUrl = 'https://faucet.devnet.aptoslabs.com';
        break;
    }

    const envContent = `NEXT_PUBLIC_NETWORK=${answers.network}
NEXT_PUBLIC_APTOS_NODE_URL=${nodeUrl}
NEXT_PUBLIC_APTOS_FAUCET_URL=${faucetUrl}

# Contract addresses (update these with your deployed contract addresses)
NEXT_PUBLIC_DEVNET_PACKAGE_ID=""
NEXT_PUBLIC_TESTNET_PACKAGE_ID=""
NEXT_PUBLIC_MAINNET_PACKAGE_ID=""
`;
    await fs.writeFile(envPath, envContent);
    console.log(chalk.green('✅ Created .env file'));

    // Update README.md
    console.log(chalk.yellow('📖 Updating README.md...'));
    const readmePath = path.join(targetDir, 'README.md');
    if (await fs.pathExists(readmePath)) {
      let readmeContent = await fs.readFile(readmePath, 'utf8');
      readmeContent = readmeContent.replace(/{{PROJECT_NAME}}/g, answers.projectName);
      await fs.writeFile(readmePath, readmeContent);
      console.log(chalk.green('✅ Updated README.md'));
    }

    // Success message
    console.log(chalk.green(`\n🎉 Project ${answers.projectName} has been created successfully!`));
    console.log(chalk.blue('\n📋 Next steps:'));
    console.log(chalk.cyan(`   cd ${answers.projectName}`));
    console.log(chalk.cyan('   npm install'));
    console.log(chalk.cyan('   npm run dev'));
    
    console.log(chalk.blue('\n🔗 Your Aptos dApp will be running at http://localhost:3000'));
    console.log(chalk.gray('\n💡 Don\'t forget to update the contract addresses in your .env file after deploying your contracts!'));

  } catch (err) {
    console.error(chalk.red('❌ Error creating project:'), err);
    process.exit(1);
  }
}

generateProject();

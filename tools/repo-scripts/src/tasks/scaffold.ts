import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import type { Task } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_TYPES = {
  'node-app': 'Node.js application',
  'react-app': 'React application with Vite',
  'component-library': 'React component library'
};

async function replaceTemplateVariables(filePath: string, variables: Record<string, string>) {
  const content = await fs.readFile(filePath, 'utf-8');
  let updatedContent = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    updatedContent = updatedContent.replace(regex, value);
  }
  
  await fs.writeFile(filePath, updatedContent);
}

async function processDirectory(dir: string, variables: Record<string, string>) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath, variables);
    } else if (entry.isFile()) {
      // Replace variables in text files
      const ext = path.extname(entry.name);
      const textExtensions = ['.json', '.ts', '.tsx', '.js', '.jsx', '.md', '.html', '.css', '.yml', '.yaml'];
      
      if (textExtensions.includes(ext)) {
        await replaceTemplateVariables(fullPath, variables);
      }
    }
  }
}

const scaffold: Task = {
  command: 'scaffold',
  description: 'Create a new package from template',
  execute: async (additionalArgs = []) => {
    try {
      // Get template type from args or prompt
      let templateType = additionalArgs[0];
      
      if (!templateType || !Object.keys(TEMPLATE_TYPES).includes(templateType)) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'templateType',
            message: 'What type of package would you like to create?',
            choices: Object.entries(TEMPLATE_TYPES).map(([value, label]) => ({
              name: label,
              value
            }))
          }
        ]);
        templateType = answers.templateType;
      }

      // Prompt for package details
      const packageAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Package name (without @claude-flow/ prefix):',
          validate: (input: string) => {
            if (!input) return 'Package name is required';
            if (!/^[a-z0-9-]+$/.test(input)) {
              return 'Package name must be lowercase letters, numbers, and hyphens only';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'description',
          message: 'Package description:',
          default: ''
        },
        {
          type: 'list',
          name: 'location',
          message: 'Where should this package be created?',
          choices: [
            { name: 'apps/', value: 'apps' },
            { name: 'packages/', value: 'packages' }
          ],
          default: templateType === 'react-app' ? 'apps' : 'packages'
        }
      ]);

      // Determine paths
      const repoRoot = path.resolve(__dirname, '../../../..');
      const templatePath = path.join(repoRoot, 'tools', 'templates', templateType!);
      const targetPath = path.join(repoRoot, packageAnswers.location, packageAnswers.name);

      // Check if target already exists
      if (await fs.pathExists(targetPath)) {
        console.log(chalk.red(`Error: Directory ${targetPath} already exists`));
        return { success: false };
      }

      // Copy template
      console.log(chalk.blue(`Creating ${templateType} at ${targetPath}...`));
      await fs.copy(templatePath, targetPath);

      // Replace template variables
      const variables = {
        name: packageAnswers.name,
        description: packageAnswers.description || `${packageAnswers.name} package`
      };

      await processDirectory(targetPath, variables);

      console.log(chalk.green(`✓ Created ${templateType} package: ${packageAnswers.name}`));
      console.log(chalk.gray(`  Location: ${targetPath}`));
      console.log();

      // Store the original cwd before changing directory
      const originalCwd = process.cwd();
      
      // Change to the new directory
      process.chdir(targetPath);
      console.log(chalk.blue('Installing dependencies...'));
      
      // Install dependencies
      const { execa } = await import('execa');
      await execa('pnpm', ['install'], { stdio: 'inherit' });
      console.log(chalk.green('✓ Dependencies installed'));
      console.log();
      
      console.log(chalk.green('✨ Package created successfully!'));
      console.log();
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.yellow(`  cd ${path.relative(originalCwd, targetPath)}`));
      
      switch (templateType) {
        case 'component-library':
          console.log(chalk.gray('  pnpm dev          # Start Storybook'));
          console.log(chalk.gray('  pnpm build        # Build library'));
          console.log(chalk.gray('  pnpm test         # Run tests'));
          break;
          
        case 'react-app':
          console.log(chalk.gray('  pnpm dev          # Start development server'));
          console.log(chalk.gray('  pnpm dev:storybook # Start Storybook'));
          console.log(chalk.gray('  pnpm build        # Build for production'));
          console.log(chalk.gray('  pnpm test         # Run tests'));
          break;
          
        case 'node-app':
          console.log(chalk.gray('  pnpm dev          # Start TypeScript watch mode'));
          console.log(chalk.gray('  pnpm build        # Build for production'));
          console.log(chalk.gray('  pnpm test         # Run tests'));
          break;
      }

      return { success: true };
    } catch (error) {
      console.error(chalk.red('Error during scaffolding:'), error);
      return { success: false };
    }
  }
};

export { scaffold };
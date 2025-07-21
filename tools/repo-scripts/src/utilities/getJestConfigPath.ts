import fs from 'fs';
import path from 'path';

export function getJestConfigPath(packageRoot: string): string {
  // Look for jest config files in order of preference
  const configFiles = [
    'jest.config.js',
    'jest.config.mjs',
    'jest.config.cjs',
    'jest.config.json',
    'jest.config.ts',
  ];

  for (const configFile of configFiles) {
    const configPath = path.join(packageRoot, configFile);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  // Check if package.json has jest config
  const packageJsonPath = path.join(packageRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.jest) {
      return packageJsonPath;
    }
  }

  throw new Error(`No Jest configuration found in ${packageRoot}`);
}

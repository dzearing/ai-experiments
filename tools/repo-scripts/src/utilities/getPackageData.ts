import fs from 'fs';
import path from 'path';
import resolve from 'resolve';
import { findPackageRoot } from 'workspace-tools';

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  bin?: string | Record<string, string>;
  [key: string]: unknown;
}

export interface PackageData {
  packageRoot: string;
  packageJson: PackageJson;
  packageJsonPath: string;
}

export interface GetPackageDataOptions {
  name: string;
  fromPath: string;
}

/**
 * Get data about either the current package, or a package by name.
 */
export function getPackageData(cwdOrName?: string | GetPackageDataOptions): PackageData {
  let packageRoot: string;
  let packageJsonPath: string;

  // Default to current directory if no argument
  if (!cwdOrName) {
    cwdOrName = process.cwd();
  }

  if (typeof cwdOrName === 'string') {
    const foundRoot = findPackageRoot(cwdOrName);
    if (!foundRoot) {
      throw new Error('Unable to find package root from ' + cwdOrName);
    }
    packageRoot = foundRoot;
    packageJsonPath = path.join(packageRoot, 'package.json');
  } else {
    const { name, fromPath } = cwdOrName;
    packageJsonPath = resolve.sync(name + '/package.json', { basedir: fromPath });
    if (!packageJsonPath) {
      throw new Error(`Unable to resolve package "${name}"`);
    }
    packageRoot = path.dirname(packageJsonPath);
  }

  return {
    packageRoot,
    packageJsonPath,
    packageJson: JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')),
  };
}

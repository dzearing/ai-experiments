import { getPackageData } from './getPackageData.js';

export type PackageType = 'react-app' | 'component-library' | 'node-app' | 'unknown';

/**
 * Detect the type of package based on packageType field in package.json
 */
export function detectPackageType(cwd: string = process.cwd()): PackageType {
  const { packageJson } = getPackageData(cwd);

  // Check for explicit packageType field
  if (packageJson.packageType) {
    const validTypes: PackageType[] = ['react-app', 'component-library', 'node-app'];
    if (validTypes.includes(packageJson.packageType as PackageType)) {
      return packageJson.packageType as PackageType;
    }
  }

  return 'unknown';
}

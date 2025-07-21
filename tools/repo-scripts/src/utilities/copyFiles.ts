import { cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';

export interface CopyFilesOptions {
  pattern: string;
  srcDir: string;
  destDir: string;
}

/**
 * Copy files matching a pattern from source to destination
 */
export function copyFiles({ pattern, srcDir, destDir }: CopyFilesOptions): void {
  const files = glob.sync(pattern, {
    cwd: join(process.cwd(), srcDir),
  });

  console.log(`Copying ${files.length} files from ${srcDir} to ${destDir}`);

  files.forEach((file) => {
    const src = join(process.cwd(), srcDir, file);
    const dest = join(process.cwd(), destDir, file);

    // Ensure destination directory exists
    mkdirSync(dirname(dest), { recursive: true });

    cpSync(src, dest, { recursive: true });
  });
}

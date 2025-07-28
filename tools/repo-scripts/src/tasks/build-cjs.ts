import { build } from './build.js';
import fs from 'fs';
import path from 'path';
import { globSync } from 'tinyglobby';
import type { Task } from '../types.js';

const buildCJS: Task = {
  command: 'build-cjs',
  description: 'Build CommonJS output',
  execute: async function buildCJS(additionalArgs = []) {
    await build.execute([
      '--module',
      'commonjs',
      '--moduleResolution',
      'node10',
      '--outDir',
      'lib-commonjs',
      '--verbatimModuleSyntax',
      'false',
      ...additionalArgs,
    ]);

    // rename all the .js files to .cjs
    const jsFiles = globSync('lib-commonjs/**/*.js', { cwd: process.cwd() });

    for (const jsFile of jsFiles) {
      const fullPath = path.join(process.cwd(), jsFile);
      const cjsFile = fullPath.replace(/\.js$/, '.cjs');

      fs.renameSync(fullPath, cjsFile);

      // Replace require("./*.js") with require("./*.cjs").
      // TS output is predictable enough that we don't need to use a full codemod library for this.
      const newContents = fs
        .readFileSync(cjsFile, 'utf-8')
        .replace(/require\(["'](\.[^"']+)\.js["']\)/g, (_match, p1) => `require("${p1}.cjs")`);
      fs.writeFileSync(cjsFile, newContents);
    }
  },
};

export { buildCJS };

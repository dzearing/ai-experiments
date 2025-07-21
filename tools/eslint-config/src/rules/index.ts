import { noDeprecated } from './no-deprecated.js';
import { noDefaultExport } from './no-default-export.js';
import { oneExportPerFile } from './one-export-per-file.js';

export const rules = {
  'no-deprecated': noDeprecated,
  'no-default-export': noDefaultExport,
  'one-export-per-file': oneExportPerFile,
};
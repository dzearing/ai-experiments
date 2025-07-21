#!/usr/bin/env node
import { runLint } from '@claude-flow/repo-scripts';

await runLint({
  additionalArgs: process.argv.slice(2),
});

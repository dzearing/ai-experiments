#!/usr/bin/env node
import { runTest } from '@claude-flow/repo-scripts';

await runTest({
  additionalArgs: process.argv.slice(2)
});
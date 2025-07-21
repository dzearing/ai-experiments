#!/usr/bin/env node
import { runBuild } from '@claude-flow/repo-scripts';

await runBuild({
  additionalArgs: process.argv.slice(2),
});

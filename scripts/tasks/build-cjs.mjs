#!/usr/bin/env node
import { runBuildCJS } from '@claude-flow/repo-scripts';

await runBuildCJS({
  additionalArgs: process.argv.slice(2)
});
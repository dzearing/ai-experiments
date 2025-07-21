#!/usr/bin/env node
import { runLintFix } from '@claude-flow/repo-scripts';

await runLintFix({
  additionalArgs: process.argv.slice(2),
});

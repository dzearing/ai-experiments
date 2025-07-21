module.exports = {
  pipeline: {
    build: {
      dependsOn: ['^build'],
      outputs: ['lib/**', 'dist/**', 'build/**'],
    },
    test: {
      dependsOn: ['build'],
    },
    lint: {
      dependsOn: [],
    },
    'format:check': {
      dependsOn: [],
      cache: true,
    },
    typecheck: {
      dependsOn: ['^build'],
    },
    dev: {
      cache: false,
      persistent: true,
    },
  },
  npmClient: 'pnpm',
};

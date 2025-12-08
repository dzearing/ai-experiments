module.exports = {
  plugins: {
    'postcss-import': {
      resolve: (id, basedir) => {
        // Handle @claude-flow/ui-kit imports
        if (id.startsWith('@claude-flow/ui-kit/')) {
          const path = id.replace('@claude-flow/ui-kit/', '../ui-kit/dist/');
          return path;
        }
        return id;
      }
    }
  }
};
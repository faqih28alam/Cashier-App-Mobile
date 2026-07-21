const path = require('path');

/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async config => {
    // Route React Native primitives (View/Text/StyleSheet/...) to their
    // react-native-web DOM implementations, and pin react/react-dom to
    // web-ui's own copy. The imported components live outside web-ui/, in
    // ../src, so Node module resolution would otherwise find the root
    // project's react install for those files while web-ui's own files
    // (and react-dom, which only exists here) use web-ui/node_modules'
    // copy - two React instances in one render tree.
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native$': path.resolve(__dirname, '../node_modules/react-native-web'),
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    };
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...(config.resolve.extensions || []),
    ];
    config.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            ['@babel/preset-react', {runtime: 'automatic'}],
            '@babel/preset-typescript',
          ],
        },
      },
    });
    return config;
  },
};

module.exports = config;

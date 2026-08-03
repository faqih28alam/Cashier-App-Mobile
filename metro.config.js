const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // See metro-stubs/crypto.js for why this is needed (bcryptjs).
    extraNodeModules: {
      crypto: path.resolve(__dirname, 'metro-stubs/crypto.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

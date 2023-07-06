const webpackMerge = require('webpack-merge');
const path = require('path');
const baseConfig = require('agora-common-libs/presets/webpack.config.base.js');
const ROOT_PATH = path.resolve(__dirname, './');

const config = {
  entry: {
    onlineclass_sdk: './src/index',
  },
  output: {
    path: path.resolve(ROOT_PATH, 'lib'),
    publicPath: './',
    filename: '[name].bundle.js',
    libraryTarget: 'umd',
    clean: true,
  },
  resolve: {
    alias: {
      '@res': path.resolve(ROOT_PATH, './src/resources'),
      '@onlineclass': path.resolve(ROOT_PATH, './src'),
      '@components': 'agora-scenario-ui-kit/src/components',
      '@ui-kit-utils': 'agora-scenario-ui-kit/src/utils',
    },
  },
};

const mergedConfig = webpackMerge.merge(baseConfig, config);
module.exports = mergedConfig;

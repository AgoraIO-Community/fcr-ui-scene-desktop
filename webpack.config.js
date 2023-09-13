const webpackMerge = require('webpack-merge');
const path = require('path');
const baseConfig = require('agora-common-libs/presets/webpack.config.base.js');
const packConfig = require('agora-common-libs/presets/webpack.config.pack.js');

const ROOT_PATH = path.resolve(__dirname, './');

const config = {
  entry: {
    scene: './src/index',
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
      '@ui-scene': path.resolve(ROOT_PATH, './src'),
      '@components': 'fcr-ui-kit/src/components',
      '@ui-kit-utils': 'fcr-ui-kit/src/utils',
    },
  },
};

const mergedConfig = webpackMerge.merge(baseConfig, packConfig, config);
module.exports = mergedConfig;

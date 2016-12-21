const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');

require('babel-polyfill');

const isDevelopment = JSON.stringify(process.env.NODE_ENV) !== 'production';

const config = {
  entry: { lights: "./js/lights-entry.js" },
  output: {
    path: path.join(__dirname, `./build/generated`),
    publicPath: '/generated/',
    filename: '[name].entry.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          // Speed up compilation.
          cacheDirectory: '.babelcache'

          // Also see .babelrc
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style-loader', `css!resolve-url!sass`)
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isDevelopment ? 'production' : 'development'
      }
    }),

    new ExtractTextPlugin('[name].css'),
  ],
};

if (isDevelopment) {
  config.devtool = '#eval-source-map';
} else {
  config.devtool = '#source-map';
  baseConfig.plugins.push(new webpack.optimize.DedupePlugin());
  baseConfig.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true));
  baseConfig.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = config;

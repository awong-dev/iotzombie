const config = require('./webpack.config.js');
const webpack = require('webpack');

config.entry.lights.unshift('webpack/hot/only-dev-server');
config.entry.lights.unshift('react-hot-loader/patch');

config.plugins.unshift(new webpack.HotModuleReplacementPlugin());

config.devServer = {
  historyApiFallback: true,
  contentBase: "./public",
  quiet: false,
  hot: true
}

module.exports = config;

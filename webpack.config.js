const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV !== 'production';

const config = {
  entry: {
    lights: [
      "./client/lights-entry.jsx"
    ]
  },
  resolve: { extensions: ['.js', '.jsx'] },
  output: {
    path: path.join(__dirname, `./public/generated`),
    publicPath: '/generated/',
    filename: '[name].entry.js'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader:  MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                includePaths: glob.sync('node_modules').map((d) => path.join(__dirname, d)),
              }
            }
          }
        ],
      },
	 {
	   test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'client'),
          path.resolve(__dirname, 'node_modules/@material')
        ],
        exclude: /node_modules/,
	   use: {
		loader: 'babel-loader',
		options: {
		  // Also see .babelrc
		  cacheDirectory: '.babelcache',
            presets: ['@babel/preset-env']
		}
	   }
	 }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isDevelopment ? "'development'" : "'production'"
      }
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
};

if (isDevelopment) {
  config.devtool = '#eval-source-map';
} else {
  config.devtool = '#source-map';
  config.optimization = {minimize: true};
}

module.exports = config;

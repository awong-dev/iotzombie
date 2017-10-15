const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV !== 'production';

const extractSass = new ExtractTextPlugin({
      filename: "[name].css"
});

const config = {
  entry: { lights: ["./client/lights-entry.jsx"] },
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
        use: extractSass.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader' },
            { loader: 'sass-loader',
              options: {
                sourceMap: true,
                includePaths: glob.sync('node_modules').map((d) => path.join(__dirname, d)),
              } }
          ],
          fallback: 'style-loader'
        })
      },
	 {
	   test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'client'),
          path.resolve(__dirname, 'node_modules/@material')
        ],
	   use: {
		loader: 'babel-loader',
		options: {
		  // Also see .babelrc
		  cacheDirectory: '.babelcache',
            presets: ['env']
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

    extractSass
  ],
};

if (isDevelopment) {
  config.devtool = '#eval-source-map';
} else {
  config.devtool = '#source-map';
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({sourceMap: true}));
}

module.exports = config;

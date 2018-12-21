const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    app: './src',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
    publicPath: 'http://localhost:3000/build/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
      }
    ]
  },

  resolve: {
    alias: {
      mycache: path.resolve(__dirname, '../lib'),
    }
  },

  plugins: [
    new webpack.DefinePlugin({
      __DEV__: true,
      __DEVTOOLS__: true,
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
}
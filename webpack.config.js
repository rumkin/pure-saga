const webpack = require('webpack');

const debug = process.env.NODE_ENV !== 'production';
const filename = debug ? 'pure-saga.js' : 'pure-saga.min.js';

module.exports = {
  entry: __dirname + '/src/index.js',
  output: {
    path: __dirname + '/dist',
    filename,
    library: 'pureSaga',
  },
  module: {
    loaders: [
        {
          test: /\.js$/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'react'],
            },
        },
    ],
  },
  plugins: debug ? [] : [
    new webpack.optimize.UglifyJsPlugin(),
  ],
};

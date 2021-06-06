const path = require('path');

module.exports = {

  mode: 'development',
  devtool: 'inline-source-map',

  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};

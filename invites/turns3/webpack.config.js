const path = require('path');

module.exports = {
  entry: './src/react-button.js',
  output: {
    filename: 'react-integration.js',
    path: path.resolve(__dirname),
    publicPath: './'
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
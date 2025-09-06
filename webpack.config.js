//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
  target: 'node', // VS Code extensions run in Node.js environment
  mode: 'none', // Use 'none' or 'development' for dev, 'production' for release

  entry: './src/extension.ts', // Extension entry point
  output: {
    // Output location for bundled files
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // vscode module is external dependency, don't bundle
  },
  resolve: {
    // Support reading TypeScript and JavaScript files
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map', // Generate source map for debugging
  infrastructureLogging: {
    level: "log", // Enable logging
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/resources', to: 'resources' }
      ]
    })
  ]
};

module.exports = [ extensionConfig ];
import webpack from 'webpack';
import { resolve } from 'path';
import externals from 'webpack-node-externals';
const FileManagerPlugin = require('filemanager-webpack-plugin');

const config: webpack.Configuration = {
  context: process.cwd(),
  entry: {
    commands: resolve('src/commands.ts'),
    index: resolve('src/index.ts')
  },
  devtool: 'source-map',
  mode: 'production',
  target: 'node',
  externals: [externals()],
  plugins: [
    new FileManagerPlugin({
      onStart: [
        {
          delete: ['./dist', './commands.js']
        }
      ],
      onEnd: [
        {
          move: [{ source: './dist/commands.js', destination: './commands.js' }]
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.ts']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  output: {
    libraryTarget: 'commonjs',
    path: resolve('./dist'),
    filename: '[name].js'
  }
};

export default config;

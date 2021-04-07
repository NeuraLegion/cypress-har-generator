import webpack from 'webpack';
import externals from 'webpack-node-externals';
import { resolve } from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
  externals: externals() as never,
  plugins: [
    new FileManagerPlugin({
      events: {
        onStart: [
          {
            delete: ['./dist', './commands.js', './commands.js.map']
          }
        ],
        onEnd: [
          {
            move: [
              { source: './dist/commands.js', destination: './commands.js' },
              {
                source: './dist/commands.js.map',
                destination: './commands.js.map'
              }
            ]
          }
        ]
      }
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

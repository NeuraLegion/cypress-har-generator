const externals = require('webpack-node-externals');
const { resolve } = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const configFile = resolve('./tsconfig.build.json');

/** @type {import('webpack').Configuration} */
module.exports = {
  context: process.cwd(),
  entry: {
    commands: resolve('src/commands.ts'),
    index: resolve('src/index.ts')
  },
  devtool: 'source-map',
  mode: 'production',
  target: 'node',
  externals: externals(),
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
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile
            }
          }
        ]
      }
    ]
  },
  output: {
    libraryTarget: 'commonjs',
    path: resolve('./dist'),
    filename: '[name].js'
  }
};

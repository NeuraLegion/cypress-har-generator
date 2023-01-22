import externals from 'webpack-node-externals';
import FileManagerPlugin from 'filemanager-webpack-plugin';
import { Configuration } from 'webpack';
import { resolve } from 'path';

const config: Configuration = {
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
    parser: {
      javascript: {
        commonjsMagicComments: true
      }
    },
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: resolve('./tsconfig.build.json')
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

export default config;

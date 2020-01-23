/* eslint-disable no-console */
import * as fs from "fs-extra";
import * as path from "path";
import chalk from "chalk";
import * as webpack from "webpack";
import nodeExternals from "webpack-node-externals";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import ForkTsCheckerNotifierWebpackPlugin from "fork-ts-checker-notifier-webpack-plugin"

const pkg = require("./package.json");
const tsConfig = require("./tsconfig.json");

const { black, green, bgGreen } = chalk;
const { NODE_ENV } = process.env;
console.log(
  `Webpack build ${green("NODE_ENV")} 👉 ${bgGreen(` ${black(NODE_ENV)} `)}`
);

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";
const isDevMode = mode === "development";
const prodEntries = {
  index: ["./src/index.ts"]
};

const outDir = "dist";
const entries = isDevMode
  ? {
    ...prodEntries,
    index: ["webpack/hot/poll?1000", "./src/index.ts"]
  }
  : prodEntries;

fs.removeSync(path.resolve(__dirname, outDir));

const buildNum = () => {
  const { CI, CIRCLE_BUILD_NUM, CIRCLE_BRANCH, CIRCLE_PR_NUMBER } = process.env;
  if (CI) {
    const build = `-build[${CIRCLE_BUILD_NUM}]`;
    if (CIRCLE_BRANCH === "master") {
      return build;
    }
    if (CIRCLE_BRANCH === "develop") {
      return `${build} (dev)`;
    }
    return `${build} (pr:${CIRCLE_PR_NUMBER})`;
  }
  return "-(local)";
};

// Make ts path resolvers for webpack
const { baseUrl } = tsConfig.compilerOptions;
const tsPaths = tsConfig.compilerOptions.paths;
const resolvedTsPaths = {};
Object.keys(tsPaths).forEach(pathName => {
  const [tsPath] = tsPaths[pathName];
  let cleanPathName = pathName.replace(/\*/gi, "");
  cleanPathName =
    cleanPathName[cleanPathName.length - 1] === "/"
      ? cleanPathName.substring(0, cleanPathName.length - 1)
      : cleanPathName;
  const resolvedPath = path.resolve(
    __dirname,
    baseUrl,
    tsPath.replace(/\*/gi, "")
  );
  resolvedTsPaths[cleanPathName] = resolvedPath;
});

console.log("TypeScript resolved paths");
console.log("👇");
console.log(resolvedTsPaths);

export default {
  mode,
  target: "node",
  stats: {
    warnings: false
  },
  node: {
    __dirname: false,
    __filename: false
  },
  context: __dirname,
  entry: entries,
  externals: [
    nodeExternals({
      whitelist: ["webpack/hot/poll?1000"]
    })
  ],
  devtool: "inline-source-map",
  optimization: {
    minimize: false,
    nodeEnv: false,
    removeAvailableModules: false,
    removeEmptyChunks: true,
    splitChunks: false
  },
  devServer: {
    hot: true,
    contentBase: path.resolve(__dirname),
    publicPath: "/"
  },
  resolve: {
    mainFields: ["main", "module"],
    extensions: [".ts", ".js", ".graphql", ".gql"],
    alias: {
      ...resolvedTsPaths
    }
  },
  plugins: [
    ...(isDevMode ? [] : [new CleanWebpackPlugin()]),
    new webpack.DefinePlugin({
      "process.env.APP_VERSION": JSON.stringify(pkg.version + buildNum()),
      "process.env.APP_NAME": JSON.stringify(pkg.name),
      "process.env.BUILD_ENV": JSON.stringify(NODE_ENV)
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin(),
    new ForkTsCheckerWebpackPlugin({
      reportFiles: ['!node_modules/**/*.d.ts']
    }),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false }),
    new CopyWebpackPlugin(
      [
      ],
      {
        ignore: ["*.ts"]
      }
    )
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
          experimentalWatchApi: true,
        }
      },
      {
        enforce: "pre",
        test: /\.(ts)$/,
        loader: "tslint-loader",
        exclude: /(node_modules)/,
        options: {
          emitErrors: true
        }
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: "graphql-tag/loader"
      }
    ]
  },
  output: {
    pathinfo: false,
    filename: "[name].js",
    path: path.resolve(__dirname, outDir),
    devtoolModuleFilenameTemplate(info) {
      return path.resolve(__dirname, encodeURI(info.resourcePath));
    },
    library: "[name]",
    libraryTarget: "umd"
  }
};

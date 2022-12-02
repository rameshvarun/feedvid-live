const webpack = require("webpack");
const path = require("path");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const common = env => ({
  entry: "./src/index.tsx",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(png|svg|jpg|gif|mp4|ogg|mp3|wav|woff|woff2|glb)$/,
        type: "asset/resource"
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }]
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./node_modules/three/examples/js/libs/basis/", to: "basis" }
      ]
    }),
    new HtmlWebpackPlugin({
      template: "src/index.html",
      templateParameters: {
        title: "FeedVid Live"
      }
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require("./package.json").version),
      MODE: JSON.stringify(env.mode)
    })
  ]
});

const development = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    host: "local-ipv4"
  }
};

const production = {
  mode: "production"
};

module.exports = env => {
  if (env.mode === "production") return merge(common(env), production);
  else if (env.mode === "development") return merge(common(env), development);
  else throw new Error(`Unknown mode: ${env.mode}`);
};

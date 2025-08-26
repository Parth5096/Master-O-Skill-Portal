const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const dotenv = require("dotenv");
const webpack = require("webpack");

dotenv.config();

module.exports = {
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "assets/bundle.[contenthash].js",
    publicPath: "/"
  },
  resolve: { extensions: [".js", ".jsx"] },
  module: {
    rules: [
      { test: /\.(js|jsx)$/, exclude: /node_modules/, use: "babel-loader" },
      { test: /\.css$/i, use: ["style-loader", "css-loader"] }
    ]
  },
  devServer: {
    port: 3000,
    host: "0.0.0.0",        
    allowedHosts: "all",
    historyApiFallback: true,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      inject: "body",
      templateParameters: {
        API_BASE: process.env.API_BASE || "http://localhost:4000/api"
      }
    }),
    new webpack.DefinePlugin({
      __API_BASE__: JSON.stringify(process.env.API_BASE || "http://localhost:4000/api")
    })
  ]
};

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
  },
  devtool: "source-map",
  performance: { hints: false },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    host: "127.0.0.1",
    port: 8002,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "public/osrs-assets", to: "osrs-assets", noErrorOnMissing: true },
        { from: "index.html", to: "", context: "src/" },
        { from: "robots.txt", to: "", context: "src/" },
        { from: "sitemap.xml", to: "", context: "src/" },
        { from: "docs/screenshots/phase2-portals.jpg", to: "og-image.jpg" },
        { from: "*.png", to: "", context: "node_modules/osrs-sdk/_bundles/", noErrorOnMissing: true },
        { from: "*.gif", to: "", context: "node_modules/osrs-sdk/_bundles/", noErrorOnMissing: true },
        { from: "*.ogg", to: "", context: "node_modules/osrs-sdk/_bundles/", noErrorOnMissing: true },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ogg|gltf|glb)$/i,
        type: "asset/resource",
      },
    ],
  },
};

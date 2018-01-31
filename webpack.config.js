const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const GitRevisionPlugin = require("git-revision-webpack-plugin");

const extractLess = new ExtractTextPlugin({
	filename: "[name].css",
	disable: process.env.NODE_ENV === "development"
});
const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = {
	entry: "./src/index.tsx",
	output: {
		filename: "app.js",
		path: __dirname + "/dist",
		publicPath: "/"
	},
	devtool: "source-map",
	plugins: [
		extractLess,
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/index.html',
			inject: 'body'
		}),
		new CopyWebpackPlugin([
			{from: 'assets/**/*'}
		]),
		new webpack.DefinePlugin({
			'__VERSION': JSON.stringify(require('./package.json').version),
			'__HASH': JSON.stringify(gitRevisionPlugin.version()),
		})
	],

	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"]
	},

	module: {
		rules: [
			{ test: /\.css$/, loaders: ['style-loader', 'css-loader'] },
			{ test: /\.tsx?$/, loader: "awesome-typescript-loader" },
			{ enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
			{
				test: /\.less$/,
				use: extractLess.extract({
					use: [{ loader: "css-loader" }, { loader: "less-loader" }],
					fallback: "style-loader"
				})
			}
		]
	},
	devServer: {
		historyApiFallback: {
			index: "",
			verbose: true,
			disableDotRule: true
		}
	}
};
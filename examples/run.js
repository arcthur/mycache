var webpack = require("webpack");
var webpackDevServer = require("webpack-dev-server");
var config = require("./webpack.config.js");
var compiler = webpack(config);

var server = new webpackDevServer(compiler, {
  publicPath: config.output.publicPath,
  noInfo: false,
});

server.listen(3000);

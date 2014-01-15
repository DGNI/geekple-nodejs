module.exports = init;

var path = require('path')
  , fs = require('fs')
  , ini = require('ini')
  , request = require('request')
  , colors = require('colors')
  , mkdirp = require('mkdirp')
  , geekple = require('../index');

init.usage = 'geekple init [TeamID]';

init.validate = function(argv) {
  if (!geekple.config.get('user.username') || !geekple.config.get('user.token')) {
    return 401;
  }
  return argv && argv.length == 1;
};

function init(argv, done) {
  var confdir = path.join(process.cwd(), '.geekple');
  var permalink = argv[0];
  mkdirp(path.join(confdir), function(e, res) {
  	var obj = {team: {permalink: permalink}};
  	fs.writeFileSync(path.join(confdir, 'config'), ini.stringify(obj));
    console.log("Initialized empty GeekPLE repository in " + confdir);
  });
}

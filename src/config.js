module.exports = config;

var VERSION = '1.0.0';

var ini = require('ini')
  , fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , colors = require('colors')
  , extend = require('node.extend')
  , dir = process.cwd()
  , home = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

function config() {
};

config.init = function(fn) {
  mkdirp.mkdirp(path.join(home, '.geekple'), function(e, res) {
    if (res != null) { 
      console.log('GeekPLE for developers CLI'.green);
      console.log(' * initialized.'); 
      fs.writeFileSync(path.join(home, '.geekple', 'config'), '');
    }
    fn();
  });
};

config.update = function(file, kv) {
  if (kv == null && typeof file == 'object') {
    kv = file;
    file = path.join(home, ".geekple", "config");
  }
  var old;
  try {
    var raw = fs.readFileSync(file, 'utf-8', 'r');
    old = ini.parse(raw);
    old = extend(true, old, kv);
  } catch (e) {
  }
  var neo = old || kv;
  fs.writeFileSync(file, ini.stringify(neo));
};

config.destroy = function() {
};

config.load = function(fn) {
  config.init(function() {
    var raw = fs.readFileSync(path.join(home, '.geekple', 'config'), 'utf-8', 'r');
    var dirs = [];
    var length = dir.split(path.sep).length-1
      , current = dir;
    for (var i = 0; i < length; i++) {
      dirs.push(current);
      current = path.resolve(current, "..");
    }
    var dest = ini.parse(raw);
    for (var i = 0; i < dirs.length; i++) {
      dir = dirs[i];
      if (home == dir) {
        break;
      }
      try {
        var raw = fs.readFileSync(path.join(dir, '.geekple', 'config'), 'utf-8', 'r');
        dest = extend(true, dest, ini.parse(raw) || {});
        config.rootdir = dir;
        break;
      } catch (e) {
      }
    }
    config.config = dest || {};
    fn(null, new Config(config.config));
  });
};

function Config(options) {
  Object.defineProperty(this, 'host', {value: process.env.DEV ? 'http://local.geekple.com':'http://geekple.com'});
  Object.defineProperty(this, 'home', {value: home});
  Object.defineProperty(this, 'loaded', {value: true});
  Object.defineProperty(this, 'version', {value: VERSION});
  this.options = options;
}

Config.prototype.path = function(fullpath) {
  var path = fullpath;
  if (fullpath.indexOf(config.rootdir) === 0) {
    path = fullpath.substring(config.rootdir.length);
    while (path && path[0] == '/') {
      path = path.substring(1);
    }
  }
  return path;
};

Config.prototype.get = function(name) {
  var pair = name.split(".", 2);
  var section = pair.length == 2 ? pair[0] : null;
  name = section && section.length > 0 ? pair[1] : name;
  if (section) {
  	return this.options[section] ? this.options[section][name] : null;
  }
  return this.options[name];
};

Config.prototype.set = function(name, value) {
  var pair = name.split(".", 2);
  var section = pair.length == 2 ? pair[0] : null;
  name = section && section.length > 0 ? pair[1] : name;
  if (section) {
    if (!this.options[section]) {
      this.options[section] = {};
    }
    this.options[section][name] = value;
  } else {
  	this.options[name] = value;
  }
};
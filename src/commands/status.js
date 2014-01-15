module.exports = status;

var path = require('path')
  , fs = require('fs')
  , request = require('request')
  , optimist = require('optimist')
  , colors = require('colors')
  , crypto = require('crypto')
  , geekple = require('../index');

status.usage = 'geekple status -e md,txt,markdown';

status.validate = function(argv) {
  if (!geekple.config.get('user.username') || !geekple.config.get('user.token')) {
    return 401;
  }
  return true;
};

function status(argv, done) {
  argv = optimist(argv)
    .default('d', 1)
    .default('e', 'md,txt,markdown')
    .argv;
  var uri = process.cwd();
  if (uri) {
    var exts = argv.e.split(',');
    try {
      var files = fs.readdirSync(uri);
      var matches = files.filter(function(file) {
        var pos = file.lastIndexOf(".")
          , ext = pos > 0 ? file.substring(pos+1) : '';
        return exts.indexOf(ext) >= 0;
      }).map(function(file) {
        var fullpath = geekple.config.path(path.join(uri, file));
        var text = fs.readFileSync(path.join(uri, file), 'utf-8', 'r');
        var sha = crypto.createHash('sha1').update(text).digest('hex');
        return {uri: fullpath, sha: sha};
      });
      _status(matches);
    } catch (e) {
      console.log(e);
    }
  }
  done();
}


function _status(files) {
  request({
    method: 'POST'
    , uri: geekple.config.host+'/v1/cli/commands/status'
    , headers: {
      'Content-Type': 'application/json'
      , 'X-Requested-With': 'XMLHttpRequest'
      , 'X-GeekPLE-Version': geekple.config.version
      , 'X-GeekPLE-Username': geekple.config.get('user.username')
      , 'X-GeekPLE-Token': geekple.config.get('user.token')
    }
    , json: files
  }, function(err, rs) {
    try {
      var files = rs.body;
      if (rs.statusCode == 200 && files) {
        var trackedFiles = files.filter(function(f) { return f.state == 'up to date' });
        var changedFiles = files.filter(function(f) { return f.state == 'modified' });
        var untrackedFiles = files.filter(function(f) { return f.state == 'untracked' });


        if (trackedFiles.length > 0) {
          console.log('# Staged files:');
          var max = Math.max.apply(null, trackedFiles.map(function(f) { return f.uri.length }));
          var columns = parseInt(80 / (max+4));
          function pad(text, length) {
            var value = text;
            for (var i = text.length; i < length; i++) {
              value += ' ';
            }
            return value;
          }
          var filenames = trackedFiles.map(function(f) { return pad(f.uri, 80 / columns) });
          for (var i = 0; i < filenames.length; i+= columns) {
            console.log(filenames.slice(i, i+columns).join('').cyan);
          }
        }

        if (changedFiles.length > 0) {
          console.log('# Changes not staged:');
          console.log('#   (use "geekple diff [filename] and geekple add [filename]")');
          changedFiles.forEach(function(file) {
            console.log("#\t" + file.state.red + "\t" + file.uri.red);
          });
        }

        if (untrackedFiles.length > 0) {
          console.log('# Untracked files:');
          console.log('#   (use "geekple add [filename]")');
          untrackedFiles.forEach(function(file) {
            console.log("#\t" + file.uri.red);
          });
        }
        if (rs.headers['x-ratelimit-remaining']) {
          console.log('rate limit - remaining: ' + rs.headers['x-ratelimit-remaining']);
        }
      } else if (files) {
        console.error(files.message || 'unknown error');
        console.log(files);
      }
    } catch (e) {
      console.error(e);
    }
  });
};
module.exports = open;

var path = require('path')
  , fs = require('fs')
  , request = require('request')
  , colors = require('colors')
  , opener = require('opener')
  , geekple = require('../index');

open.usage = 'geekple open [filename]';

open.validate = function(argv) {
  if (!geekple.config.get('user.username') || !geekple.config.get('user.token')) {
    return 401;
  }
  return argv && argv.length == 1;
};

function open(argv, done) {
  argv.forEach(function(filename) {
    var uri = path.join(process.cwd(), filename);
    if (filename && uri) {
      try {
        var text = fs.readFileSync(uri, {encoding: 'UTF-8', flag: 'r'});
        _open({
          uri: geekple.config.path(uri)
          , team: {
            permalink: geekple.config.get('team.permalink')
          }
        });
      } catch (e) {
        console.log(e);
      }
    }
  });
  done();
}

function _open(row) {
  request({
    method: 'POST'
    , uri: geekple.config.host+'/v1/cli/commands/info'
    , headers: {
      'Content-Type': 'application/json'
      , 'X-Requested-With': 'XMLHttpRequest'
      , 'X-GeekPLE-Version': geekple.config.version
      , 'X-GeekPLE-Username': geekple.config.get('user.username')
      , 'X-GeekPLE-Token': geekple.config.get('user.token')
    }
    , json: row
  }, function(err, rs) {
    try {
      var draft = rs.body;
      if (draft && draft.code == 'success') {
        if (!draft.id) {
          console.log('No such file.'.red + ' You could upload to team repository on GeekPLE. Please type ' + ('`geekple add ' + row.uri + '`').red);
        }
        if (draft.lines_of_body) {
          var message = draft.lines_of_body + 'L '.bold
            + draft.words_of_body + 'W '.bold
            + draft.chars_of_body + 'C\n'.bold
            + draft.insertions + ' insertions(+), '.bold.green
            + draft.deletions + ' deletions(-)'.bold.red;
          console.log(message);
        }
        if (rs.headers['x-ratelimit-remaining']) {
          console.log('rate limit - remaining: ' + rs.headers['x-ratelimit-remaining']);
        }

        if (draft.id > 0) {
          opener(geekple.config.host+'/drafts/'+draft.uid);
        }
      } else if (draft) {
        console.error(draft.message || 'unknown error');
        console.log(draft);
      }
    } catch (e) {
      console.error(e);
    }
  });
};
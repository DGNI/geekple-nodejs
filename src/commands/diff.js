module.exports = diff;

var path = require('path')
  , fs = require('fs')
  , request = require('request')
  , colors = require('colors')
  , opener = require('opener')
  , geekple = require('../index');

diff.usage = 'geekple diff [filename]';

diff.validate = function(argv) {
  if (!geekple.config.get('user.username') || !geekple.config.get('user.token')) {
    return 401;
  }
  return argv && argv.length == 1;
};

function diff(argv, done) {
  argv.forEach(function(filename) {
    var uri = path.join(process.cwd(), filename);
    if (filename && uri) {
      try {
        var text = fs.readFileSync(uri, {encoding: 'UTF-8', flag: 'r'});
        _diff({
          uri: geekple.config.path(uri)
          , text: text
          , diff: true
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

function _diff(row) {
  request({
    method: 'POST'
    , uri: geekple.config.host+'/v1/cli/commands/diff'
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
        if (draft.insertions + draft.deletions === 0) {
          var draft_url = geekple.config.host+'/drafts/'+draft.uid;
          console.log('No changes'.red);
          console.log('Please visit this page. ' + draft_url.red);
          return;
        } else if (!draft.id) {
          console.log('No such file.'.red + ' You could upload to team repository on GeekPLE. Please type ' + ('`geekple add ' + row.uri + '`').red);
        }
        var message = draft.lines_of_body + 'L '.bold
          + draft.words_of_body + 'W '.bold
          + draft.chars_of_body + 'C\n'.bold
          + draft.insertions + ' insertions(+), '.bold.green
          + draft.deletions + ' deletions(-)'.bold.red;
        console.log(message);
        (draft.diff||'').split('\n').forEach(function(line) {
          if (line.indexOf('@@') === 0) {
            console.log(line.cyan);
          } else if (line.indexOf('+') === 0) {
            console.log(line.green);
          } else if (line.indexOf('-') === 0) {
            console.log(line.red);
          } else if (line != '\n') {
            console.log(line);
          }
        });

        if (draft.id > 0) {
          var draft_url = geekple.config.host+'/drafts/'+draft.uid;
          console.log('Please visit this page. ' + draft_url.red);
        }
        if (rs.headers['x-ratelimit-remaining']) {
          console.log('rate limit - remaining: ' + rs.headers['x-ratelimit-remaining']);
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
module.exports = add;

var path = require('path')
  , fs = require('fs')
  , request = require('request')
  , colors = require('colors')
  , opener = require('opener')
  , geekple = require('../index');

add.usage = 'geekple add [filename ...]';

add.validate = function(argv) {
  if (!geekple.config.get('user.username') || !geekple.config.get('user.token')) {
    return 401;
  }
  return argv && argv.length >= 1;
};

function add(argv, done) {
  argv.forEach(function(filename) {
    var uri = path.join(process.cwd(), filename);
    if (filename && uri) {
      try {
        var text = fs.readFileSync(uri, {encoding: 'UTF-8', flag: 'r'});
        _add({
          uri: geekple.config.path(uri)
          , text: text
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
};

function _add(row) {
  request({
    method: 'POST'
    , uri: geekple.config.host+'/v1/cli/commands/add'
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
          if (draft.snippet) {
            var url = geekple.config.host + '/teams/' + draft.snippet.team.permalink
              + '/snippets/' + draft.snippet.id;
            console.log('The snippet where this file is stored is ' + url +' .');
          }
          return;
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

        var draft_url = geekple.config.host+'/drafts/'+draft.uid;
        console.log('Please visit this page. ' + draft_url.red);
        opener(draft_url);
        if (rs.headers['x-ratelimit-remaining']) {
          console.log('rate limit - remaining: ' + rs.headers['x-ratelimit-remaining']);
        }
      } else if (draft) {
        console.error(draft.message || 'unknown error');
        console.log(rs.body);
        console.log(draft);
      }
    } catch (e) {
      console.error(e);
    }
  });
};
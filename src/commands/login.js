module.exports = login

var geekple = require('../index')
  , gconfig = require('../config')
  , read = require('read')
  , colors = require('colors')
  , request = require('request');

login.usage = 'geekple login';

login.validate = function(args) {
  return true;
};

function login(args, done) {
  var fns = [readUsername, readPassword, readEmail]
    , user = {}
    , config = geekple.config.get('user')||{};

  function _loop(config, user, fn) {
    var reader = fns.shift();
    if (reader) {
      reader(config, user, function(e) {
        _loop(config, user, fn);
      });
    } else {
      fn(user);
    }
  };

  _loop(config, user, function(user) {
    geekple.config.set('user.username', user.username);
    geekple.config.set('user.email', user.email);
    request({method: 'POST', url: geekple.config.host+'/v1/tokens', json: user}, function(e, res) {
      var success = res.statusCode == 200;
      var body = res.body;
      switch (res.statusCode) {
      case 400:
        if (body.errors) {
          for (var key in body.errors) {
            console.error((' * ' + body.errors[key]).red);
          }
        } else {
          console.error('400 - username and password are required to login.'.red);
        }
        break;
      case 403:
        console.error('403 - Invalid username or password specified. Please try again.'.red);
        break;
      case 200:
        console.log('OK - Login succeed.'.green);
        geekple.config.set('user.token', res.body.token);
        break;
      }
      if (user && user.username && user.password && user.email) {
        delete user.password;
        user.token = res.body.token;
        gconfig.update({user: user});
      }
      done();
    });
  });
};

function readUsername(config, user, fn) {
  read({prompt: "Username: ", default: config.username||''}, function(e, username) {
    if (e) {
      return fn(e.message === "cancelled" ? e.message : e);
    }

    if (!username) {
      return readUsername(config, user, fn);
    }

    user.username = username;
    fn(e);
  });
}

function readPassword(config, user, fn) {
  read({prompt: "Password: ", silent: true}, function(e, password) {
    if (e) {
      return fn(e.message === "cancelled" ? e.message : e);
    }

    if (!password) {
      return readPassword(config, user, fn);
    }

    user.password = password;
    fn(e);
  });
}

function readEmail(config, user, fn) {
  read({prompt: "E-Mail: ", default: config.email||''}, function(e, email) {
    if (e) {
      return fn(e.message === "cancelled" ? e.message : e);
    }

    if (!email) {
      return readEmail(config, user, fn);
    }

    user.email = email;
    fn(e);
  })
}
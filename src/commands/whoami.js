module.exports = whoami;

var colors = require('colors')
  , opener = require('opener')
  , geekple = require('../index');

whoami.usage = 'geekple whoami';

whoami.validate = function() {
  return true;
};

function whoami(args, done) {
  if (geekple.config.get('user.username') && geekple.config.get('user.token')) {
  	console.log(geekple.config.get('user.username'));
  	opener('http://geekple.com/' + geekple.config.get('user.username'));
  } else {
  	console.log('Not logged in'.red);
  }
  done();
}


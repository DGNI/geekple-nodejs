var _commands = [
  ['login'],
  ['whoami'],
  ['init'],
  ['add'],
  ['diff'],
  ['open'],
  ['status']
];

var EventEmitter = require('events').EventEmitter
  , colors = require('colors')
  , config = require('./config')
  , geekple = module.exports = new EventEmitter;

geekple.config = {loaded: false};
geekple.commands = {};

geekple.load = function(done) {
  config.load(function(e, config) {
    geekple.config = config;
    _commands.forEach(function(names) {
      var name = names[0];
      names.forEach(function(alias) {
        geekple.commands[alias] = require(__dirname+'/commands/'+name+'.js');
      });
    });
    if (typeof done == 'function') {
      done();
    }
  });
};

geekple.destroy = function() {
  if (config && geekple.config.loaded) {
    config.destroy();
  }
};

geekple.run = function(command, args, fn) {
  if (['login', 'whoami', 'init'].indexOf(command) == -1) {
    if (!config.rootdir) {
      console.error('fatal: Not a geekple working tree (or any of the parent directories): .geekple'.red);
      console.error('fatal: type `geekple init`'.red);
      process.exit(1);
    }
  }
  if (geekple.commands[command]) {
    var rs = geekple.commands[command].validate(args);
    if (rs === true) {
      geekple.commands[command](args, fn);
    } else if (rs === false) {
      console.error('Usage: '.red + geekple.commands[command].usage);
    } else if (rs == 401) {
      console.error('Please sign in.');
      console.error('Usage: '.red + geekple.commands['login'].usage);
    }
  } else {
    console.error('geekple: \'' + command + '\' is not a geekple command. See http://geekple.com/teams/geekple/snippets/20 for more details.');
    fn({code: 'not_found', message: 'command not found.'});
  }
};
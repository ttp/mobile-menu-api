// var pg = require('pg'); 
// var conString = "tcp://mobilemenu_user:123654@localhost/mobilemenu_dev";

// var client = new pg.Client(conString);
// client.connect();

// module.exports = client;

var mongoose = require('mongoose')
  , client = mongoose.connect('mongodb://localhost/mobilemenu_dev');

var Memcached = require('memcached');
var memcached = new Memcached('127.0.0.1:11211');


exports.client = client;
exports.mongoose = mongoose;
exports.memcached = memcached;
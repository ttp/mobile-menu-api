// var pg = require('pg'); 
// var conString = "tcp://mobilemenu_user:123654@localhost/mobilemenu_dev";

// var client = new pg.Client(conString);
// client.connect();

// module.exports = client;

var mongoose = require('mongoose')
  , db = mongoose.connect('mongodb://localhost/mobilemenu_dev');
exports.db = db;
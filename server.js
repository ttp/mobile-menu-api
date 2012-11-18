var restify = require('restify');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var db = require('./db');

// if (cluster.isMaster) {
//     for (var i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }

//     cluster.on('exit', function(worker, code, signal) {
//         console.log('worker ' + worker.process.pid + ' died');
//     });
// } else {
    var server = restify.createServer({
        name: 'Mobile Menu',
    });

    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    var router = require('./routes')
    router.initRoutes(server);
    server.listen(8080);
// }
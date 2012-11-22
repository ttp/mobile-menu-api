var controllers = {};
controllers['auth'] = require('./controllers/auth_controller');
controllers['places'] = require('./controllers/places_controller');
controllers['place_types'] = require('./controllers/place_types_controller');

var map = function (route) {
    var _action = route.split('#');

    return function (req, res, next) {
        var options = {
            req: req,
            res: res,
            next: next
        };
        var controller = new controllers[_action[0]](options);
        if (controller.before !== false) {
            controller.before(function (err) {
                if (!err) {
                    controller[_action[1]]();
                }
            });
        } else {
            controller[_action[1]]();
        }
    }
}

exports.initRoutes = function (server) {
    server.get('/api/place_types', map('place_types#list'));

    server.get('/api/me/auth/ulogin/:token', map('auth#ulogin'));
    server.get('/api/me/auth/dev', map('auth#dev'));

    server.get('/api/me/places', map('places#list'));
    server.get('/api/me/places/:id', map('places#get'));
    server.post('/api/me/places', map('places#add'));
    server.put('/api/me/places/:id', map('places#save'));
}
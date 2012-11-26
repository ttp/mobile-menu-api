var controllers = {};
controllers['auth'] = require('./controllers/auth_controller');
controllers['places'] = require('./controllers/places_controller');
controllers['place_types'] = require('./controllers/place_types_controller');
controllers['menus'] = require('./controllers/menus_controller');
controllers['categories'] = require('./controllers/categories_controller');

var map = function (route) {
    var _action = route.split('#');

    return function (req, res, next) {
        var options = {
            req: req,
            res: res,
            next: next
        };
        console.log(req.params);
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

// Places
    // Get
    server.get('/api/me/places', map('places#list'));
    server.get('/api/me/places/:id', map('places#get'));
    // Create/Update
    server.post('/api/me/places', map('places#save'));
    server.put('/api/me/places/:id', map('places#save'));
    // Delete
    server.del('/api/me/places/:id', map('places#del'));
    server.post('/api/me/places/delete', map('places#del'));

// Menus
    // Get
    server.get('/api/me/menus', map('menus#list'));
    server.get('/api/me/menus/:id', map('menus#get'));
    // Create/Update
    server.post('/api/me/menus', map('menus#save'));
    server.put('/api/me/menus/:id', map('menus#save'));
    // Delete
    server.del('/api/me/menus/:id', map('menus#del'));
    server.post('/api/me/menus/delete', map('menus#del'));

// Categories
    // Get
    server.get('/api/me/categories/tree', map('categories#tree'));
    server.get('/api/me/categories/:id', map('categories#get'));
    // Create/Update
    server.post('/api/me/categories', map('categories#save'));
    server.put('/api/me/categories/:id', map('categories#save'));
    // Delete
    server.del('/api/me/categories/:id', map('categories#del'));
    server.post('/api/me/categories/delete', map('categories#del'));
}
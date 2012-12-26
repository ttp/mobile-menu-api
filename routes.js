var controllers = {};
controllers['auth'] = require('./controllers/auth_controller');
controllers['place_types'] = require('./controllers/place_types_controller');
controllers['places'] = require('./controllers/places_controller');
controllers['map'] = require('./controllers/map_controller');

// Account
controllers['account_places'] = require('./controllers/account/places_controller');
controllers['account_menus'] = require('./controllers/account/menus_controller');
controllers['account_categories'] = require('./controllers/account/categories_controller');
controllers['account_menu_items'] = require('./controllers/account/menu_items_controller');

var map = function (route) {
    var _action = route.split('#');

    return function (req, res, next) {
        var options = {
            req: req,
            res: res,
            next: next
        };
        console.log("Request:");
        console.log(req.params);
        
        var controller = new controllers[_action[0]](options);
        if (controller.before !== false) {
            controller.before(function (err) {
                if (!err) {
                    controller[_action[1]]();
                } else {
                    next(err);
                }
            });
        } else {
            controller[_action[1]]();
        }
    }
}

exports.initRoutes = function (server) {
    server.get('/api/place_types', map('place_types#list'));
    server.get('/api/places/:id/all', map('places#all'));
    
    server.get('/api/map/quad/:quad_id', map('map#quad'));

/**
* Account routes
**/
    server.get('/api/me/auth/ulogin/:token', map('auth#ulogin'));
    server.get('/api/me/auth/dev', map('auth#dev'));
// Places
    // Get
    server.get('/api/me/places', map('account_places#list'));
    server.get('/api/me/places/:id', map('account_places#get'));
    // Create/Update
    server.post('/api/me/places', map('account_places#save'));
    server.put('/api/me/places/:id', map('account_places#save'));
    // Delete
    server.del('/api/me/places/:id', map('account_places#del'));
    server.post('/api/me/places/delete', map('account_places#del'));

// Menus
    // Get
    server.get('/api/me/menus', map('account_menus#list'));
    server.get('/api/me/menus/import', map('account_menus#import'));
    server.get('/api/me/menus/:id', map('account_menus#get'));
    server.get('/api/me/menus/:id/export', map('account_menus#export'));

    // Create/Update
    server.post('/api/me/menus', map('account_menus#save'));
    server.put('/api/me/menus/:id', map('account_menus#save'));
    // Delete
    server.del('/api/me/menus/:id', map('account_menus#del'));
    server.post('/api/me/menus/delete', map('account_menus#del'));

// Categories
    // Get
    server.get('/api/me/categories/as/tree', map('account_categories#tree'));
    server.get('/api/me/categories/:id', map('account_categories#get'));
    // Create/Update
    server.post('/api/me/categories', map('account_categories#save'));
    server.put('/api/me/categories/:id', map('account_categories#save'));
    // Delete
    server.del('/api/me/categories/:id', map('account_categories#del'));
    server.post('/api/me/categories/delete', map('account_categories#del'));

// Menu Items
    // Get
    server.get('/api/me/menu_items', map('account_menu_items#list'));
    server.get('/api/me/menu_items/:id', map('account_menu_items#get'));
    // Create/Update
    server.post('/api/me/menu_items', map('account_menu_items#save'));
    server.put('/api/me/menu_items/:id', map('account_menu_items#save'));
    // Delete
    server.del('/api/me/menu_items/:id', map('account_menu_items#del'));
    server.post('/api/me/menu_items/delete', map('account_menu_items#del'));
}
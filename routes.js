var controllers = {};
controllers['places'] = require('./controllers/places_controller');
controllers['place_types'] = require('./controllers/place_types_controller');

var map = function (route) {
    var _action = route.split('#');

    return function (req, res, next) {
        // console.log(req.params);
        var options = {
            req: req,
            res: res,
            next: next
        };
        var controller = new controllers[_action[0]](options);
        if (controller.before()) {
            controller[_action[1]]();
        }
    }
}

exports.initRoutes = function (server) {
    server.get("/api/place_types", map("place_types#list"));
    server.get("/places", map("places#list"));
    server.get("/api/places", map("places#list"));
    server.get("/places/:id", map("places#get"));
    server.get("/api/places/:id", map("places#get"));
    server.post("/api/places", map("places#add"));
    server.put("/api/places/:id", map("places#save"));
}
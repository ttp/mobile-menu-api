var ApiController = require("./api_controller"),
    PlaceTypeModel = require('../models/place_type_model'),
    PlaceModel = require('../models/place_model'),
    MenuModel = require('../models/menu_model'),
    CategoryModel = require('../models/category_model'),
    MenuItemModel = require('../models/menu_item_model'),
    Seq = require('seq');

function MapController(options) {
    MapController.super_.call(this, options);
}
require("util").inherits(MapController, ApiController);
module.exports = MapController;

MapController.prototype.quad = function () {
    var self = this,
        quad_id = this._req.params['quad_id'];
    var quad = quad_id.split("_");
    Seq()
        .seq(function () {
            PlaceModel.findByQuad(quad[1], this);
        })
        .seq(function (places) {
            self._res.json({
                id: quad_id,
                places: places
            });
        })
        .catch(function (err) {
            self.sendError(err);
        });
};
var ApiController = require("./api_controller"),
    PlaceTypeModel = require('../models/place_type_model'),
    PlaceModel = require('../models/place_model'),
    MenuModel = require('../models/menu_model'),
    CategoryModel = require('../models/category_model'),
    MenuItemModel = require('../models/menu_item_model'),
    Seq = require('seq');

function PlacesController(options) {
    PlacesController.super_.call(this, options);
}
require("util").inherits(PlacesController, ApiController);
module.exports = PlacesController;

PlacesController.prototype.all = function () {
    var self = this,
        id = this._req.params['id'],
        response = {};
    Seq()
        .seq(function () {
            PlaceModel.findById(id, this);
        })
        .seq(function (place) {
            if (!place) {
                this('invalid_place');
            }
            response['place'] = place.toJSON();
            this(null, place);
        })
        .par(function (place) {
            CategoryModel.find({menu_id: place.menu_id}, this);
        })
        .par(function (place) {
            MenuItemModel.find({menu_id: place.menu_id}, this);
        })
        .seq(function (categories, menu_items) {
            response['categories'] = categories;
            response['menu_items'] = menu_items;
            self._res.json(response);
        })
        .catch(function (err) {
            self.sendError(err);
        });
};
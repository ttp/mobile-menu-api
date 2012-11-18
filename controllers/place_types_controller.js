module.exports = PlaceTypesController;

var PlaceTypeModel = require('../models/place_type_model');
var ApiController = require("./api_controller");
var Seq = require('seq');

require("util").inherits(PlaceTypesController, ApiController);

function PlaceTypesController(options) {
    ApiController.call(this, options);
}

PlaceTypesController.prototype.list = function () {
    var self = this;
    PlaceTypeModel.find({}, 'name code', function (error, rows) {
        if (error) {
            self.sendError(error);
        } else {
            self._res.json(rows);
        }
    });
};
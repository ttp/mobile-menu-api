var db = require('./db');

var Session = require('./models/session_model'),
    PlaceTypeModel = require('./models/place_type_model'),
    PlaceModel = require('./models/place_model'),
    MenuModel = require('./models/menu_model'),
    CategoryModel = require('./models/category_model'),
    MenuItemModel = require('./models/menu_item_model'),
    Seq = require('seq');

Seq()
    .seq(function () {
        PlaceModel.ensureIndexes(this);
    })
    .seq(function () {
        MenuModel.ensureIndexes(this);
    })
    .seq(function () {
        CategoryModel.ensureIndexes(this);
    })
    .seq(function () {
        MenuItemModel.ensureIndexes(this);
    })
    .seq(function () {
        Session.model.ensureIndexes(this);
    })
    .seq(function () {
        console.log("finished");
    })
    .catch(function (err) {
        console.log(err);
    });

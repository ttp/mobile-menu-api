var PlaceModel = require('../../models/place_model'),
    PlaceTypeModel = require('../../models/place_type_model'),
    MenuModel = require('../../models/menu_model'),
    GridModel = require('../../models/grid_model'),
    AccountController = require("./account_controller"),
    Seq = require('seq');

function AccountPlacesController(options) {
    AccountPlacesController.super_.call(this, options);

    this._fields = ['name', 'description', 'coord_lat', 'coord_lng', 'place_type_code', 'show_on_map'];
}
require("util").inherits(AccountPlacesController, AccountController);
module.exports = AccountPlacesController;

AccountPlacesController.prototype.list = function () {
    var res = this._res;

    var gridModel = new GridModel({
        model: PlaceModel,
        conditions: {"account_id": this._account_id},
        sortable_cols: {"name": "name", "created_at": "_id"},
        params: this._req.params
    });
    Seq()
        .par(function () {
            gridModel.count(this);
        })
        .par(function () {
            gridModel.rows(this);
        })
        .seq(function (cnt, rows) {
            res.send({
                total: cnt,
                rows: rows
            });
        }).catch(function (err) {
            res.json({error: err});
        });
};

AccountPlacesController.prototype.count = function () {
    var res = this._res;

    var gridModel = new GridModel({
        model: PlaceModel,
        conditions: {"account_id": this._account_id}
    });
    if (this.hasParam('verified')) {
        gridModel.setCondition('verified', this.getParam('verified') == 'true');
    }
    Seq()
        .seq(function () {
            gridModel.count(this);
        })
        .seq(function (cnt) {
            res.send({
                count: cnt
            });
        }).catch(function (err) {
            res.json({error: err});
        });
};

AccountPlacesController.prototype.get = function () {
    PlaceModel.findOne({'_id': this._req.params['id']}, null, null, this._getCallback.bind(this));
};

AccountPlacesController.prototype.save = function () {
    var self = this,
        placeRow,
        menuRow,
        params = this._req.params;

    Seq()
        .seq(function () {// find or create new Place
            if (params['id']) {
                PlaceModel.findById(params['id'], this)
            } else {
                var place = new PlaceModel({
                    account_id: self._account_id
                });
                this(null, place);
            }
        })
        .seq(function (place) { // Validate place account, fill out values
            if (!place) {
                return this('place_not_found');
            }
            if (place.account_id != self._account_id) {
                return this('invalid_place');
            }
            self._fields.forEach(function (field) {
                if (params.hasOwnProperty(field)) {
                    place[field] = params[field];
                }
            });
            placeRow = place;
            place.validate(this);
        })
        .seq(function () {// find or create menu
            if (params.hasOwnProperty('menu_id') && params['menu_id'] != '0') {
                MenuModel.findById(params['menu_id'], this);
            } else {
                MenuModel.create({
                    name: placeRow.name + ' Menu',
                    account_id: self._account_id
                }, this);
            }
        })
        .seq(function (menu) {// validate menu, save place
            if (!menu) {
                return this('menu_not_found');
            }
            if (menu.account_id != self._account_id) {
                return this('invalid_menu');
            }
            menuRow = menu;
            
            placeRow.menu_id = menu.id;
            placeRow.save(this);
        })
        .seq(function (place) {
            var response = {
                success: true,
                row: place
            };
            if (params['menu'] == '0') {
                response.menu = menuRow
            }
            self._res.json(response);
        }).catch(function (err) {
            self.sendError(err);
        });
};

AccountPlacesController.prototype.del = function () {
    var self = this;
    var ids = this._req.params['id'].split(',');
    Seq(ids)
        .parMap(function (id) {// find by id
            PlaceModel.findById(id, this);
        })
        .parEach(function (place) {// validate account and remove
            if (place && place.account_id == self._account_id) {
                place.remove(this);
            } else {
                this();
            };
        })
        .seq(function () { // send succes message
            self.sendSuccess();
        })
        .catch(function (err) {
            self.sendError(err);
        });
}
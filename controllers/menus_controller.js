var MenuModel = require('../models/menu_model'),
    GridModel = require('../models/grid_model'),
    AccountController = require("./account_controller"),
    Seq = require('seq');

function MenusController(options) {
    MenusController.super_.call(this, options);

    this._fields = ['name'];
}
require("util").inherits(MenusController, AccountController);
module.exports = MenusController;

MenusController.prototype.list = function () {
    var res = this._res;

    var gridModel = new GridModel({
        model: MenuModel,
        conditions: {"account_id": this._account_id},
        sortable_cols: {"name": "name", "created_at": "id"},
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

MenusController.prototype.get = function () {
    MenuModel.findOne({'_id': this._req.params['id']}, null, null, this._getCallback.bind(this));
};

MenusController.prototype.save = function () {
    var self = this,
        params = this._req.params;

    Seq()
        .seq(function () {// find or create Menu
            if (params['id']) {
                MenuModel.findById(params['id'], this)
            } else {
                var menu = new MenuModel({
                    account_id: self._account_id
                });
                this(null, menu);
            }
        })
        .seq(function (menu) { // Validate menu account, fill out values
            if (!menu) {
                return this('menu_not_found');
            }
            if (menu.account_id != self._account_id) {
                return this('invalid_menu');
            }
            self._fields.forEach(function (field) {
                if (params.hasOwnProperty(field)) {
                    menu[field] = params[field];
                }
            });
            menu.save(this);
        })
        .seq(function (menu) {
            self._res.json({
                success: true,
                row: menu
            });
        }).catch(function (err) {
            self.sendError(err);
        });
};

MenusController.prototype.del = function () {
    var self = this,
        ids = this._req.params['id'].split(',');
    Seq(ids)
        .parMap(function (id) {// find by id
            MenuModel.findById(id, this);
        })
        .parEach(function (menu) {// validate account and remove
            if (menu && menu.account_id == self._account_id) {
                menu.remove(this);
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
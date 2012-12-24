var MenuModel = require('../../models/menu_model'),
    GridModel = require('../../models/grid_model'),
    CategoryModel = require('../../models/category_model'),
    ExportCsv = require('../../models/export_csv'),
    AccountController = require("./account_controller"),
    Seq = require('seq');

function AccountMenusController(options) {
    AccountMenusController.super_.call(this, options);

    this._fields = ['name'];
}
require("util").inherits(AccountMenusController, AccountController);
module.exports = AccountMenusController;

AccountMenusController.prototype.list = function () {
    var res = this._res;

    var gridModel = new GridModel({
        model: MenuModel,
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

AccountMenusController.prototype.get = function () {
    MenuModel.findOne({'_id': this._req.params['id']}, null, null, this._getCallback.bind(this));
};

AccountMenusController.prototype.save = function () {
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

AccountMenusController.prototype.del = function () {
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
};

AccountMenusController.prototype.before = function (cb) {
    this._user_id = "50cc682c16487d6c0b000004";
    this._account_id = "50cc682c16487d6c0b000003";
    cb();
};

AccountMenusController.prototype.export = function () {
    var self = this,
        id = this._req.params['id'];
    id = "50d8ae781d9ee8f213000004";

    Seq()
        .seq(function () {// find by id
            MenuModel.findById(id, this);
        })
        .par(function (menu) {
            CategoryModel.find({menu_id: menu._id}, this);
        })
        // .par(function (menu) {
            
        // })
        .seq(function (categories) {
            var csv = new ExportCsv(categories, []);
            csv.export(function (err, data) {
                self._res.writeHead(200, {
                  'Content-Length': Buffer.byteLength(data),
                  'Content-Type': 'text/plain'
                });
                self._res.write(data);
                self._res.end();
            });
        })
        .catch(function (err) {
            self.sendError(err);
        });
}
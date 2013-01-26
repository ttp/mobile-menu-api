var MenuModel = require('../../models/menu_model'),
    GridModel = require('../../models/grid_model'),
    CategoryModel = require('../../models/category_model'),
    MenuItemModel = require('../../models/menu_item_model'),
    ExportCsv = require('../../models/export_csv'),
    ImportCsv = require('../../models/import_csv'),
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

AccountMenusController.prototype.export = function () {
    var self = this,
        id = this._req.params['id'];

    Seq()
        .seq(function () {// find by id
            MenuModel.findById(id, this);
        })
        .seq(function (menu) { // Validate menu account, fill out values
            if (!menu) {
                return this('menu_not_found');
            }
            if (menu.account_id != self._account_id) {
                return this('invalid_menu');
            }
            this(null, menu);
        })
        .par(function (menu) {
            CategoryModel.find({menu_id: menu._id}, this);
        })
        .par(function (menu) {
            MenuItemModel.find({menu_id: menu._id}, this);
        })
        .seq(function (categories, menu_items) {
            var csv = new ExportCsv(categories, menu_items);
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

AccountMenusController.prototype.import = function () {
    var self = this;

    var csv_content = this._req.params['content'];

    var menu = new MenuModel({
        account_id: this._account_id,
        name: this._req.params['name']
    });
    var importService = new ImportCsv(menu);

    Seq()
        .seq(function () {
            importService.parse(csv_content, this);
        })
        .seq(function () {// Save menu
            menu.save(this);
        })
        .seq(function () {// Save categories
            var parentSeq = this;
            Seq(importService._categories)
                .parEach(function (category) {
                    category.save(this);
                })
                .seq(function () {
                    parentSeq();
                })
                .catch(function (err) {
                    parentSeq(err);
                });
        })
        .seq(function () {// Save menu_items
            var parentSeq = this;
            Seq(importService._menu_items)
                .parEach(function (menu_item) {
                    menu_item.save(this);
                })
                .seq(function () {
                    parentSeq();
                })
                .catch(function (err) {
                    parentSeq(err);
                });
        })
        .seq(function () {
            self._res.json({
                success: true,
                menu: menu
            });
        })
        .catch(function (err) {
            self.sendError(err);
        });
}
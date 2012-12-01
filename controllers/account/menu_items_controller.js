var MenuModel = require('../../models/menu_model'),
    CategoryModel = require('../../models/category_model'),
    MenuItemModel = require('../../models/menu_item_model'),
    GridModel = require('../../models/grid_model'),
    AccountController = require("./account_controller"),
    Seq = require('seq');

function AccountMenuItemsController (options) {
    AccountMenuItemsController.super_.call(this, options);

    this._fields = ['name', 'description', 'weight'];
}
require("util").inherits(AccountMenuItemsController, AccountController);
module.exports = AccountMenuItemsController;

AccountMenuItemsController.prototype.list = function () {
    var params = this._req.params,
        self = this;
    if (!params['menu_id']) {
        this.sendError('invalid_menu');
        return this._next();
    }

    var gridModel = new GridModel({
        model: MenuItemModel,
        conditions: {
            "menu_id": params['menu_id']
        },
        sortable_cols: {"name": "name", "created_at": "id"},
        params: params
    });
    Seq()
        .par(function () {
            MenuModel.findById(params['menu_id'], this);
        })
        .par(function () {
            var category_id = params['category_id'] || '0';
            if (category_id != '0') {
                CategoryModel.findById(category_id, this);
            } else {
                this();
            }
        })
        .seq(function (menu, category) {
            if (!menu || menu.account_id != self._account_id) {
                return this('invalid_menu');
            }
            if (category && category.menu_id != menu.id) {
                return this('invalid_category');
            }
            if (category) {
                gridModel.setCondition("categories", {$in: [category.id]});
            }
            this();
        })
        .par(function () {
            gridModel.count(this);
        })
        .par(function () {
            gridModel.rows(this);
        })
        .seq(function (cnt, rows) {
            self._res.json({
                total: cnt,
                rows: rows
            });;
        })
        .catch(function (err) {
            self.sendError(err);
        });
};

AccountMenuItemsController.prototype.get = function () {
    var self = this;
    Seq()
        .seq(function () {
            MenuItemModel.findById(self._req.params['id'], this);
        })
        .seq(function (menu_item) {
            var seq = this;
            
            if (!menu_item) {
                return this('invalid_menu_item');
            }
            Seq()
                .par(function () {
                    MenuModel.findById(menu_item.menu_id, this);
                })
                .par(function () {
                    CategoryModel.findById(menu_item.category_id, this);
                })
                .seq(function (menu, category) {
                    seq(null, menu, category, menu_item);
                })
                .catch(function (err) { seq(err); });

        })
        .seq(function (menu, category, menu_item) {
            if (menu.account_id != self._account_id) {
                return this('invalid_account');
            }

            var response = menu_item.toJSON();
            response['category'] = category.toJSON();
            self._res.json(response);
        })
        .catch(function (err) {
            self.sendError(err);
        });
    
};

AccountMenuItemsController.prototype.save = function () {
    var self = this,
        params = this._req.params,
        prev_parent_id;

    Seq()
        .par(function () {// select menu
            MenuModel.findById(params['menu_id'], this);
        })
        .par(function () {// select category
            CategoryModel.findById(params['category_id'], this)
        })
        .par(function () {// select menu_item
            if (params['id']) {
                MenuItemModel.findById(params['id'], this);
            } else {
                this(null, null);
            }
        })
        .seq(function (menu, category, menu_item) {// validate input ids
            if (!menu || menu.account_id != self._account_id) {
                return this('invalid_menu');
            }
            if (!category || category.menu_id != menu.id) {
                return this('invalid_category');
            }
            if (menu_item && menu_item.menu_id != menu.id) {
                return this('invalid_menu_item');
            }

            if (!menu_item) {
                var categories = category.parent_id ? category.parents : [];
                categories.push(category.id);
                menu_item = new MenuItemModel({
                    menu_id: menu.id,
                    category_id: category.id,
                    categories: categories
                });
            }

            self._fields.forEach(function (field) {
                if (params.hasOwnProperty(field)) {
                    menu_item.set(field, params[field]);
                }
            });
            menu_item.setPrices(category.price_titles, JSON.parse(params['prices']));
            menu_item.save(this);
        })
        .seq(function (menu_item) {
            self._res.json({
                success: true,
                row: menu_item
            });
        }).catch(function (err) {
            self.sendError(err);
        });
};

AccountMenuItemsController.prototype.del = function () {
    var self = this,
        ids = this._req.params['id'].split(',');
    Seq(ids)
        .parMap(function (id) {// find by id
            MenuItemModel.findById(id, this);
        })
        .parEach(function (menu_item) {// validate account and remove
            var parentSeq = this;
            Seq()
                .seq(function () {
                    MenuModel.findById(menu_item.menu_id, this);
                })
                .seq(function (menu) {
                    if (menu.account_id != self._account_id) {
                        return parentSeq('invalid_menu_item');
                    }
                    menu_item.remove(parentSeq);
                })
                .catch(function (err) {
                    parentSeq(err);
                });
            
        })
        .seq(function () { // send succes message
            self.sendSuccess();
        })
        .catch(function (err) {
            self.sendError(err);
        });
}
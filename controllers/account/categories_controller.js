var MenuModel = require('../../models/menu_model'),
    CategoryModel = require('../../models/category_model'),
    AccountController = require("./account_controller"),
    Seq = require('seq');

function AccountCategoriesController (options) {
    AccountCategoriesController.super_.call(this, options);

    this._fields = ['name'];
}
require("util").inherits(AccountCategoriesController, AccountController);
module.exports = AccountCategoriesController;

AccountCategoriesController.prototype.tree = function () {
    var params = this._req.params,
        self = this;
    Seq()
        .par(function () {
            MenuModel.findById(params['menu_id'], this);
        })
        .par(function () {
            var category_id = params['node'] || '0';
            if (category_id != '0') {
                CategoryModel.findById(category_id, this);
            } else {
                this();
            }
        })
        .seq(function (menu, category) {
            if (!menu || menu.account_id != self._account_id) {
                this('category_invalid_menu');
            }
            if (category && category.menu_id != menu.id) {
                return this('category_invalid_category');
            }
            var parent_id = category ? category.id : '0';
            CategoryModel.getTree(menu.id, parent_id, this);
        })
        .seq(function (tree) {
            self._res.json(tree);
        })
        .catch(function (err) {
            self.sendError(err);
        });
};

AccountCategoriesController.prototype.get = function () {
    var self = this,
        categoryRow;
    Seq()
        .seq(function () {
            CategoryModel.findById(self._req.params['id'], this);
        })
        .seq(function (category) {
            if (!category) {
                return seq('invalid_category');
            }
            categoryRow = category;
            var seq = this;
            Seq()
                .par(function () {
                    MenuModel.findById(categoryRow.menu_id, this);
                })
                .par(function() {
                    if (categoryRow.parent_id) {
                        CategoryModel.findById(categoryRow.parent_id, this);
                    } else {
                        this(null, null);
                    }
                })
                .seq(function (menu, parent) {
                    seq(null, menu, parent);
                })
                .catch(function (err) { seq(err); });

        })
        .seq(function (menu, parent) {
            if (!menu || menu.account_id != self._account_id) {
                return this('invalid_account');
            }

            var response = categoryRow.toJSON();
            if (parent) {
                response.parent = parent.toJSON();
            }
            self._res.json(response);
        })
        .catch(function (err) {
            self.sendError(err);
        });
    
};

AccountCategoriesController.prototype.save = function () {
    var self = this,
        params = this._req.params,
        prev_parent_id;

    Seq()
        .par(function () {// select menu
            MenuModel.findById(params['menu_id'], this);
        })
        .par(function () {// select category
            if (params['id']) {
                CategoryModel.findById(params['id'], this)
            } else {
                this(null, null);
            }
        })
        .par(function () {// select parent category
            if (params['parent_id'] && params['parent_id'] != '0') {
                CategoryModel.findById(params['parent_id'], this);
            } else {
                this(null, null);
            }
        })
        .seq(function (menu, category, parentCategory) {// validate input ids
            if (!menu || menu.account_id != self._account_id) {
                return this('invalid_menu');
            }
            if (parentCategory && parentCategory.menu_id != menu.id) {
                return this('invalid_parent_category');
            }
            if (category && category.menu_id != menu.id) {
                return this('invalid_category');
            }

            if (category && parentCategory) {
                var parentIsMe = (category.id == parentCategory.id);
                var parentIsChild = (parentCategory.parents && (category.id in parentCategory.parents));
                if (parentIsMe || parentIsChild) {
                    return this('invalid_parent_category');
                }
            }
            this(null, menu, category, parentCategory);
        })
        .seq(function (menu, category, parentCategory) { // fill out values and save
            if (!category) {
                category = new CategoryModel({
                    menu_id: menu.id,
                    price_titles: []
                });
            }
            prev_parent_id = category.parent_id;
            category.setParent(parentCategory);
            self._fields.forEach(function (field) {
                if (params.hasOwnProperty(field)) {
                    category.set(field, params[field]);
                }
            });
            // set price titles
            if (params['price_titles']) {
                var titles = JSON.parse(params['price_titles']);
                category.setPriceTitles(titles['price_titles']);
                category.removePriceTitles(titles['removed_titles']);
            }

            category.save(this);
        })
        .seq(function (category) {
            if (prev_parent_id != category.parent_id) {
                category.updateChildrenParents();
            }
            
            // TODO update menu_items categories property
            self._res.json({
                success: true,
                row: category
            });
        }).catch(function (err) {
            self.sendError(err);
        });
};

AccountCategoriesController.prototype.del = function () {
    var self = this,
        ids = this._req.params['id'].split(',');
    Seq(ids)
        .parMap(function (id) {// find by id
            CategoryModel.findById(id, this);
        })
        .parEach(function (category) {// validate account and remove
            var parentSeq = this;
            Seq()
                .seq(function () {
                    MenuModel.findById(category.menu_id, this);
                })
                .seq(function (menu) {
                    if (menu.account_id != self._account_id) {
                        return parentSeq('invalid_category');
                    }
                    this();
                })
                .par(function () {
                    category.removeChildren(this);
                })
                .par(function () {
                    category.removeMenuItems(this);
                })
                .seq(function () {
                    category.remove(parentSeq);
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
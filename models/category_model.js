var mongoose = require('mongoose'),
    MenuItemModel = require('./menu_item_model'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    _ = require("underscore");

var PriceTitleSchema = new mongoose.Schema({
    title: String,
    sort_order: Number
});


var CategorySchema = new mongoose.Schema({
    menu_id: mongoose.Schema.Types.ObjectId,
    
    parent_id: mongoose.Schema.Types.ObjectId,
    parents: [mongoose.Schema.Types.ObjectId],
    
    name: String,
    price_titles: [PriceTitleSchema],

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
CategorySchema.set('autoIndex', false);
CategorySchema.index({ menu_id: 1 });
CategorySchema.index({ parent_id: 1 });
CategorySchema.index({ parents: 1 });

// Static methods
CategorySchema.static('getTree', getTree);
CategorySchema.static('getFlattenTree', getFlattenTree);
function getTree(menu_id, parent_id, cb) {
    getFlattenTree(menu_id, function (err, tree) {
        var result = getChildren(parent_id, tree);
        cb(err, result);
    });
}

function getFlattenTree(menu_id, cb) {
    var tree = {'0': []};
    CategoryModel.find({menu_id: menu_id}, function (err, rows) {
        rows = _.sortBy(rows, 'name');
        
        rows.forEach(function (row) {
            var parent_id = row.parent_id ? row.parent_id : '0';
            if (!tree[parent_id]) {
                tree[parent_id] = [];
            }
            tree[parent_id].push(row.toJSON());
        });
        cb(err, tree);
    });
}

function getChildren(parent_id, tree) {
    if (!tree.hasOwnProperty(parent_id)) {
        return [];
    }
    var items = tree[parent_id];
    items.forEach(function (item) {
        item['children'] = getChildren(item._id, tree);
        item['leaf'] = false;
    });
    return items;
}

// Model methods
CategorySchema.methods.setParent = function (parentCategory) {
    if (!parentCategory) {
        this.parent_id = null;
        this.parents = null;
    } else {
        this.parent_id = parentCategory.id;
        var parents = parentCategory.parents ? parentCategory.parents.slice() : [];
        parents.push(this.parent_id);
        this.parents = parents;
    }
}
CategorySchema.methods.removeChildren = function (cb) {
    CategoryModel.find({parents: {$in: [this.id]}}).remove(cb);
}
CategorySchema.methods.removeMenuItems = function (cb) {
    MenuItemModel.find({categories: {$in: [this.id]}}).remove(cb);
}
CategorySchema.methods.setPriceTitles = function (titles) {
    var sort_order = 0,
        price_title;
    for (var id in titles) {
        var data = {title: titles[id], sort_order: sort_order};
        if (id.search("new") !== -1) {
            this.price_titles.push(data);
        } else {
            price_title = this.price_titles.id(id);
            for (var field in data) {
                price_title[field] = data[field];
            }
        }

        ++sort_order;
    }
}
CategorySchema.methods.removePriceTitles = function (title_ids) {
    var self = this;
    title_ids.forEach(function (id) {
        // remove assigned prices
        MenuItemModel.update({ category_id: self.id }, {
            $pull: {
                prices: {"price_title_id": ObjectId(id)}
            }
        });
        // remove title
        self.price_titles.id(id).remove();
    });
}

CategorySchema.methods.updateChildrenParents = function () {
    var parents = this.parents ? this.parents.slice() : [];
    var id = this.id;

    CategoryModel.find({parents: {$in: [this.id]}}, function (err, rows) {
        if (rows) {
            rows.forEach(function (row) {
                if (row.id == id) return;
                var new_parents = parents.slice();
                new_parents = new_parents.concat(row.parents.slice(row.parents.indexOf(id)));
                row.parents = new_parents;
                row.save();
            });
        }
    });
    MenuItemModel.find({categories: {$in: [this.id]}}, function (err, rows) {
        if (rows) {
            rows.forEach(function (row) {
                var new_parents = parents.slice();
                new_parents = new_parents.concat(row.categories.slice(row.categories.indexOf(id)));
                row.categories = new_parents;
                row.save();
            });
        }
    });
}

var CategoryModel = mongoose.model('category', CategorySchema);

module.exports = CategoryModel;
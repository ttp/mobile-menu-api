var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
    menu_id: mongoose.Schema.Types.ObjectId,
    
    parent_id: mongoose.Schema.Types.ObjectId,
    parents: [mongoose.Schema.Types.ObjectId],
    
    name: String,
    price_titles: [String],

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

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
        rows.forEach(function (row) {
            var parent_id = row.parent_id ? row.parent_id : '0';
            if (!tree[parent_id]) {
                tree[parent_id] = [];
            }
            tree[parent_id].push(row.toJSON());
        });
        cb(null, tree);
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
        var parents = parentCategory.parents ? parentCategory.parents : [];
        parents.push(this.parent_id);
        this.parents = parents;
    }
}
CategorySchema.methods.removeChildren = function (cb) {
    CategoryModel.CategoryModel.find({parents: {$in: this.id}}, function (rows) {
        rows.forEach(function (row) {
            row.remove();
        });
        cb();
    });
}
CategorySchema.methods.setPriceTitles = function (titlesStr) {
    var titles = titlesStr.split(',').map(function (title) { return title.trim(); });
    this.set('price_titles', titles);
}
CategorySchema.methods.updateChildrenParents = function () {
    var parents = this.parents ? this.parents.slice() : [];
    var id = this.id;

    CategoryModel.find({parents: {$in: [this.id]}}, function (err, rows) {
        if (rows) {
            rows.forEach(function (row) {
                var new_parents = [];
                new_parents.push.apply(new_parents, parents);
                new_parents.push.apply(new_parents, row.parents.slice(row.parents.indexOf(id)));
                row.parents = new_parents;
                row.save();
            });
        }
    });
}

var CategoryModel = mongoose.model('category', CategorySchema);

module.exports = CategoryModel;
var MenuItemModel = require('./menu_item_model'),
    CategoryModel = require('./category_model'),
    csv = require("csv");

function ImportCsvService (menu) {
    this._menu = menu;
}
module.exports = ImportCsvService;

ImportCsvService.prototype = {
    _getPriceKey : function (i) {
        return "price" + (i > 0 ? i + 1 : "");
    },

    _getCategoryPriceTitles : function (row) {
        var titles = {}, key;
        for (var i = 0; i < 10; i++) {
            key = this._getPriceKey(i);
            if (!row[key]) {
                break;
            }
            titles["new" + i] = row[key] || "";
        }
        return titles;
    },

    _categoryIndentaton : function (row) {
        return row.category.length - row.category.replace(/^ */, '').length;
    },

    parse : function (csv_content) {
        var self = this;
        
        this._categories = [];
        this._menu_items = [];
        this._parents = [];
        
        var prev_indent = 0,
            prev_category = null,
            category,
            menu_item;
        csv()
            .from(csv_content, {
                columns: true
            })
            .on('record', function (row) {
                if (prev_category === null && row.category === null) {
                    return;// next
                }
                if (row.category) { // Insert category
                    var indent = self._categoryIndentaton(row);
                    if (indent > prev_indent) {
                        self._parents.push(prev_category);
                    } else if (indent < prev_indent) {
                        self._parents.pop();
                    }
                    category = self.createCategory(row);
                    prev_indent = indent;
                    prev_category = category;
                    return;// next
                } else if (row.dish_name) {// Insert menu item
                    self.createMenuItem(row, prev_category);
                }
            })
            .on('end', function () {
                console.log('csv parsing done');
            });
    },

    createCategory : function (row) {
        var category = new CategoryModel({
            menu_id: this._menu._id,
            name: row.category.trim()
        });

        if (this._parents.length) {
            category.setParent(this.getParent());
        }
        category.setPriceTitles(this._getCategoryPriceTitles(row));
        this._categories.push(category);
        return category;
    },

    createMenuItem : function (row, category) {
        var menu_item = new MenuItemModel({
            menu_id: this._menu._id,
            name: row.dish_name
        });
        menu_item.setCategory(category);

        var price_regexp = /^\d+\.?\d*$/,
            price_str,
            price;
        category.price_titles.forEach(function (item, index) {
            price_str = (row[this._getPriceKey(index)] + "").trim();
            price = price_regexp.test(price_str) ? parseFloat(price_str) : 0;
            menu_item.prices.push({
                price_title_id: item.id,
                price: price
            });
        }, this);
        this._menu_items.push(menu_item);
        return menu_item;
    },

    getParent : function () {
        return this._parents[this._parents.length - 1];
    }
};
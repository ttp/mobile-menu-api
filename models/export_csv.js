var _ = require("underscore"),
    csv = require("csv");

function ExportCsvService(categories, menu_items) {
    this._categories = _.sortBy(categories, "name");
    this._tree = this._getTree(this._categories);
    this._menu_items = _.groupBy(menu_items, "category_id");
}

ExportCsvService.prototype = {
    _getTree : function (categories) {
        return _.groupBy(categories, function (category) {
            return category.parent_id ? category.parent_id : "0";
        });
    },

    _getEmtpyCsvRow: function () {
        return {
            category: "",
            dish_name: "",
            description: "",
            weight: "",
            price: "",
            price2: "",
            price3: "",
            price4: ""
        };
    },

    _addMenuItems : function (category_id, price_titles) {
        _.each(this._menu_items[category_id], function (item) {
            var row = this._getEmtpyCsvRow();
            row.dish_name = item.name;
            row.description = item.description;
            row.weight = item.weight;

            var prices = _.groupBy(item.prices, "price_title_id");
            _.each(price_titles, function (price_title, i) {
                row[this._getPriceKey(i)] = prices[price_title._id] ? prices[price_title._id][0].price : "";
            }, this);
            this._response.push(row);
        }, this);
    },

    _getPriceKey : function (i) {
        return "price" + (i > 0 ? i + 1 : "");
    },

    _addCategories: function (parent_id) {
        if (this._tree[parent_id] === undefined) {
            return;
        }
        _.each(this._tree[parent_id], function (category) {
            var row = this._getEmtpyCsvRow();
            var indent = "";
            var price_titles;
            if (category.parents) {
                indent = new Array(category.parents.length * 2).join(" ");
            }
            row.category = indent + category.name;
            if (category.price_titles) {
                price_titles = _.sortBy(category.price_titles, "sort_order");
                _.each(price_titles, function (title, i) {
                    row[this._getPriceKey(i)] = title.title;
                }, this);
            }
            this._response.push(row);

            if (this._menu_items[category._id] !== undefined) {
                this._addMenuItems(category._id, price_titles);
            }
            if (this._tree[category._id] !== undefined) {
                this._addCategories(category._id);
            }
        }, this);
    },
    
    export : function (cb) {
        var header = _.keys(this._getEmtpyCsvRow());
        this._response = [header];
        this._addCategories("0");
        csv()
            .from.array(this._response)
            .to(function (data) {
                cb(null, data);
            });
    }
};

module.exports = ExportCsvService;
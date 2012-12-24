var _ = require("underscore"),
    csv = require("csv");

function ExportCsvService(categories, menu_items) {
    this._categories = categories;
    this._menu_items = menu_items;
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

    _pushCategories: function (parent_id) {
        if (this._tree[parent_id] === undefined) {
            return;
        }
        _.each(this._tree[parent_id], function (category) {
            var row = this._getEmtpyCsvRow();
            var indent = "";
            if (category.parents) {
                indent = new Array(category.parents.length * 2).join(" ");
            }
            row.category = indent + category.name;
            if (category.price_titles) {
                _.each(category.price_titles, function (title, i) {
                    row["price" + (i > 0 ? i + 1 : "")] = title.title;
                });
            }
            this._response.push(row);

            if (this._tree[category._id] !== undefined) {
                this._pushCategories(category._id);
            }
        }, this);
    },
    
    export : function (cb) {
        var header = _.keys(this._getEmtpyCsvRow());
        this._response = [header];

        this._tree = this._getTree(this._categories);

        this._pushCategories("0");
        csv()
            .from.array(this._response)
            .to(function (data) {
                cb(null, data);
            });
    }
};

module.exports = ExportCsvService;
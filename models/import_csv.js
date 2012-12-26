var MenuItemModel = require('./menu_item_model'),
    CategoryModel = require('./category_model'),
    _ = require("underscore"),
    csv = require("csv");

function ImportCsvService (menu_id) {
    this._menu_id = menu_id;
}
module.exports = ImportCsvService;

ImportCsvService.prototype = {
    import : function (csv_content) {
        var self = this;
        this._categories = [];
        this._items = [];
        
        var prev_indent = 0,
            prev_category = null,
            category;
        csv()
            .from(csv_content, {
                columns: true
            })
            .on('record', function (row) {
                if (prev_category === null && row.category === null) {
                    return;
                }
                if (row.category) {
                    category = new CategoryModel({
                        menu_id: self._menu_id,
                        name: row.category.replace(/^ */, '')
                    });
                    
                    indent = row.category.length - category.name.length;

                    if (prev_category) {
                        category.setParent(prev_category);
                    }
                    category.pare
                } else {

                }


                console.log(row);
            })
            .on('end', function () {
                console.log('done');
            });
    }
};
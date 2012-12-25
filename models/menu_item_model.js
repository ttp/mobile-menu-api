var mongoose = require('mongoose');

var MenuItemPriceSchema = new mongoose.Schema({
    price_title_id: mongoose.Schema.Types.ObjectId,
    price: Number
});

var MenuItemSchema = new mongoose.Schema({
    menu_id: mongoose.Schema.Types.ObjectId,
    
    category_id: mongoose.Schema.Types.ObjectId,
    categories: [mongoose.Schema.Types.ObjectId],
    
    name: String,
    description: String,
    weight: String,

    prices: [MenuItemPriceSchema],

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
MenuItemSchema.set('autoIndex', false);
MenuItemSchema.index({ menu_id: 1 });
MenuItemSchema.index({ menu_id: 1, category_id: 1 });
MenuItemSchema.index({ category_id: 1 });
MenuItemSchema.index({ categories: 1 });
MenuItemSchema.index({ menu_id: 1, name: 1 });
MenuItemSchema.index({ menu_id: 1, name: -1 });


MenuItemSchema.methods.setPrices = function (price_titles, prices) {
    var priceDoc, price;
    for (var title_id in prices) {
        price = prices[title_id] != "" ? parseFloat(prices[title_id]) : 0;

        var title = price_titles.id(title_id);
        if (!title) {
            continue;
        }

        for (var i in this.prices) {
            if (this.prices[i].price_title_id == title_id) {
                priceDoc = this.prices[i];
                break;
            }
        }
        if (priceDoc) {
            priceDoc.price = price;
        } else {
            this.prices.push({
                price_title_id: title_id,
                price: price
            });
        }
    }
}

var MenuItemModel = mongoose.model('menu_item', MenuItemSchema);
module.exports = MenuItemModel;
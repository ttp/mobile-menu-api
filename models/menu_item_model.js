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

var MenuItemModel = mongoose.model('menu_item', MenuItemSchema);
module.exports = MenuItemModel;
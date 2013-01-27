var mongoose = require('mongoose'),
    MenuItemModel = require('./menu_item_model'),
    CategoryModel = require('./category_model');

var MenuSchema = new mongoose.Schema({
    account_id: mongoose.Schema.Types.ObjectId,
    name: String,
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
MenuSchema.set('autoIndex', false);
MenuSchema.index({ account_id: 1 });
MenuSchema.index({ account_id: 1, name: 1 });
MenuSchema.index({ account_id: 1, name: -1 });

MenuSchema.methods.removeMenuItems = function (cb) {
    MenuItemModel.find({menu_id: this.id}).remove(cb);
}

MenuSchema.methods.removeCategories = function (cb) {
    CategoryModel.find({menu_id: this.id}).remove(cb);
}

module.exports = mongoose.model('menu', MenuSchema);
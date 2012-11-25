var mongoose = require('mongoose');

var MenuItemSchema = new mongoose.Schema({
    menu_id: mongoose.Schema.Types.ObjectId,
    
    category_id: mongoose.Schema.Types.ObjectId,
    categories: [mongoose.Schema.Types.ObjectId],
    
    name: String,
    description: String,
    weight: String,

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
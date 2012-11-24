var mongoose = require('mongoose');

var MenuSchema = new mongoose.Schema({
    account_id: mongoose.Schema.Types.ObjectId,
    name: String,
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('menu', MenuSchema);
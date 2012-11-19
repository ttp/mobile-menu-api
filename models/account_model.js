var mongoose = require('mongoose');

var AccountSchema = new mongoose.Schema({
    name: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('account', AccountSchema);
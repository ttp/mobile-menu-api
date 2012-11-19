var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    account_id: mongoose.Schema.Types.ObjectId,
    login: String,
    crypted_password: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('user', UserSchema);
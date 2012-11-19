var mongoose = require('mongoose');

var PlaceSchema = new mongoose.Schema({
    account_id: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    coord_lat: Number,
    coord_lng: Number,
    url_name: { type: String, unique: true },
    place_type_code: String,
    menu_id: mongoose.Schema.Types.ObjectId,
    qtree_int: Number,
    verified: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

PlaceSchema.pre('save', function (next) {
    this.qtree_int = 1;
    next();
});

module.exports = mongoose.model('place', PlaceSchema);
var mongoose = require('mongoose'),
    QuadTree = require('../libs/quadtree');

var PlaceSchema = new mongoose.Schema({
    account_id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    url_name: { type: String, required: true },
    description: String,
    
    place_type_code: String,
    menu_id: mongoose.Schema.Types.ObjectId,

    coord_lat: Number,
    coord_lng: Number,
    qtree_int: Number,
    
    verified: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

PlaceSchema.pre('save', function (next) {
    if (this.coord_lat && this.coord_lng) {
        var quad = QuadTree.latLngToQuad(this.coord_lat, this.coord_lng);
        this.qtree_int = parseInt(quad, 4);
    } else {
        this.qtree_int = 0;
    }
    next();
});

module.exports = mongoose.model('place', PlaceSchema);
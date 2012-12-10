var mongoose = require('mongoose'),
    QuadTree = require('../libs/quadtree');

var QTREE_LEN = 16;

var PlaceSchema = new mongoose.Schema({
    account_id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    description: String,
    
    place_type_code: String,
    show_on_map: {type: Boolean, default: false},
    menu_id: mongoose.Schema.Types.ObjectId,

    coord_lat: Number,
    coord_lng: Number,
    qtree_int: Number,
    
    verified: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});
PlaceSchema.set('autoIndex', false);
PlaceSchema.index({ account_id: 1 });
PlaceSchema.index({ qtree_int: 1 });

PlaceSchema.pre('save', function (next) {
    if (this.coord_lat && this.coord_lng) {
        var quad = QuadTree.latLngToQuad(this.coord_lat, this.coord_lng, QTREE_LEN);
        this.qtree_int = parseInt(quad, 4);
    } else {
        this.qtree_int = 0;
    }
    next();
});

function pad(str, dir, char, length) {
    while (str.length < length) {
        if (dir == 'left')
            str = char + str;
        if (dir == 'right')
            str += char;
    }
    return str;
}

PlaceSchema.static('findByQuad', function (quad, cb) {
    var from = pad(quad, 'right', '0', QTREE_LEN),
        to = pad(quad, 'right', '3', QTREE_LEN);
    
    var from_int = parseInt(from, 4),
        to_int = parseInt(to, 4);
    console.log({
        qtree_int: {$gte: from_int, $lte: to_int},
        show_on_map: true,
        verified: true
    });
    this.find({
        qtree_int: {$gte: from_int, $lte: to_int},
        show_on_map: true,
        verified: true
    }, cb);
});

PlaceModel = mongoose.model('place', PlaceSchema);
PlaceModel.QTREE_LEN = QTREE_LEN;
module.exports = PlaceModel;
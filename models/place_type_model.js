var mongoose = require('mongoose');

var PlaceTypeSchema = new mongoose.Schema({
    name: String,
    code: String
});

module.exports = mongoose.model('place_type', PlaceTypeSchema);
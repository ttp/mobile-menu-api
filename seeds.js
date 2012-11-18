var db = require('./db'),
    PlaceType = require("./models/place_type_model");

var place_types = [
  {name: 'Bar', code: 'bar'},
  {name: 'Cafeteria', code: 'cafeteria'},
  {name: 'Coffee', code: 'coffee'},
  {name: 'Fast Food', code: 'fastfood'},
  {name: 'Pizzaria', code: 'pizzaria'},
  {name: 'Restaurant', code: 'restaurant'}
];
PlaceType.remove(function (error) {
    if (error) {
        console.log(error);
        return;
    }

    console.log('place_types removed');

    PlaceType.create(place_types, function (error) {
        if (error) {
            console.log(error);
            return;
        }
        console.log('place_types added');
    });
});

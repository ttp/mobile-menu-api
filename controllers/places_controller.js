module.exports = PlacesController;

var PlaceModel = require('../models/place_model'),
    PlaceTypeModel = require('../models/place_type_model'),
    MenuModel = require('../models/menu_model'),
    GridModel = require('../models/grid_model'),
    ApiController = require("./api_controller"),
    Seq = require('seq');

require("util").inherits(PlacesController, ApiController);

function PlacesController(options) {
    ApiController.call(this, options);
}

PlacesController.prototype.list = function () {
    var res = this._res;

    var gridModel = new GridModel({
        model: PlaceModel,
        conditions: {"account_id": this._account_id},
        sortable_cols: {"name": "name", "created_at": "id"},
        params: this._req.params
    });
    Seq()
        .par(function () {
            gridModel.count(this);
        })
        .par(function () {
            gridModel.rows(this);
        })
        .seq(function (cnt, rows) {
            res.send({
                total: cnt,
                rows: rows
            });
        }).catch(function (err) {
            res.json({error: err});
        });
};

PlacesController.prototype.get = function () {
    PlaceModel.findOne({'_id': this._req.params['id']}, null, null, this._getCallback.bind(this));
};

PlacesController.prototype.save = function () {

};

PlacesController.prototype.add = function () {
    var self = this;
    var params = this._req.params;
    params['menu_id'] = '50a924f8bc67c790bac873a0';
    var fields = ['name', 'description', 'coord_lat', 'coord_lng', 'url_name', 'place_type_code'];
    var data = {};
    fields.forEach(function (field) {
        data[field] = params[field];
    });
    data.account_id = this._account_id;

    Seq()
        .seq(function () {
            MenuModel.findById(params['menu_id'], this);
        })
        .seq(function (menu) {
            data['menu_id'] = menu._id;
            PlaceModel.create(data, this)
        })
        .seq(function (place) {
            self._res.json({
                success: true,
                row: place
            });
        }).catch(function (err) {
            self.sendError(err);
        });

    // if params[:id] != ''
    //   place = Place.find(params[:id])
    // else
    //   place = Place.new
    //   place.account_id = @account_id
    // end

    // # Check permissions
    // if params[:id] != '' && !place.has_access?(@account_id)
    //   render :json => {:success => false, :error => "Incorrect account"} and return
    // end
    // if params[:menu_id] != '0'
    //   menu = Menu.find(params[:menu_id])
    //   if !menu.has_access?(@account_id)
    //     render :json => {:success => false, :error => "Incorrect menu"} and return
    //   end
    // end
    // # check permissions end

    // place.name = params[:name]
    // place.description = params[:description]
    // place.coord_lat = params[:coord_lat]
    // place.coord_lng = params[:coord_lng]
    // place.url_name = params[:url_name]
    // place.place_type_id = params[:place_type_id]

    // if place.valid?
    //   if params[:menu_id] == "0"
    //     menu = Menu.create({
    //       :account_id => @account_id,
    //       :name => params[:name] + " " + t(:menu)
    //     })
    //     place.menu_id = menu.id
    //   else
    //     place.menu_id = menu.id
    //   end

    //   place.save
    //   response = {:success => true}
    //   if params[:menu_id] == "0"
    //     response[:menu] = menu
    //   end
    //   render :json => response
    // else
    //   render :json => {:error => true, :messages => place.errors}
    // end
};
module.exports = AccountController;

var ApiController = require("./api_controller"),
    Seq = require('seq'),
    SessionModel = require('../models/session_model');


var ERROR_INVALID_TOKEN = "invalid_token",
    ERROR_VERIFY_TOKEN = "verify_token_error",
    ERROR_EXPIRED_TOKEN = "expired_token";

require("util").inherits(AccountController, ApiController);
function AccountController(options) {
    ApiController.call(this, options);
}

AccountController.prototype.before = function (cb) {
    var token;
    if (this._req.header('Auth-Token')) {
        token = this._req.header('Auth-Token');
    } else if (this._req.params.hasOwnProperty('token')) {
        token = this._req.params['token'];
    } else {
        this.sendError(ERROR_INVALID_TOKEN);
        cb(ERROR_INVALID_TOKEN);
    }

    var self = this;
    SessionModel.get(token, function (err, data) {
        if (err) {
            self.sendError(ERROR_VERIFY_TOKEN);
            cb(ERROR_VERIFY_TOKEN);
        } else if (data) {
            self._user_id = data['user_id'];
            self._account_id = data['account_id'];
            cb();
        } else {
            self.sendError(ERROR_INVALID_TOKEN);
            cb(ERROR_INVALID_TOKEN);
        }
    });
};
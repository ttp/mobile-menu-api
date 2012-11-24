module.exports = AuthController;

var http = require('http'),
    db = require('../db'),
    ApiController = require("./api_controller"),
    UserModel = require('../models/user_model'),
    AccountModel = require('../models/account_model'),
    SessionModel = require('../models/session_model'),
    Seq = require('seq'),
    hat = require('hat');

function AuthController(options) {
    ApiController.call(this, options);
}

require("util").inherits(AuthController, ApiController);

AuthController.prototype.ulogin = function () {
    var token = this._req.params['token'];
    var options = {
        host: 'ulogin.ru',
        path: '/token.php?token=' + token + '&host=localhost',
        method: 'GET'
    };
    var callback = this._callback.bind(this);
    http.request(options, function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            var data = JSON.parse(str);
            callback(data);
        });
    }).end();
};

AuthController.prototype._callback = function (data) {
    var self = this;
    if (data['error']) {
        this.sendError(data['error']);
    } else {
        var identity = data['identity'];
        Seq()
            .seq(function () {
                UserModel.findOne({login: identity}, this);
            })
            .seq(function (user) {
                if (user === null) {
                    self._createAccount(data['identity'], this);
                } else {
                    this(null, user);
                }
            })
            .seq(function (user) {
                self.initSession(user);
            })
            .catch(function (err) {
                self.sendError(err);
            });
    }
};

AuthController.prototype.dev = function () {
    var data = {
        identity: 'dev'
    };
    this._callback(data);
}

AuthController.prototype._createAccount = function (login, cb) {
    Seq()
        .seq(function () {
            AccountModel.create({name: login}, this);
        })
        .seq(function (account) {
            UserModel.create({
                account_id: account._id,
                login: login
            }, cb);
        })
};

AuthController.prototype.initSession = function (user) {
    // TODO generate session token, insert session data to memcached
    var token = hat();
    var self = this;
    SessionModel.set(token, {
        user_id: user._id,
        account_id: user.account_id
    }, function (err) {
        if (err) {
            self.sendError('session_start_error');
        } else {
            self._res.json({token: token});
        }
    });
};

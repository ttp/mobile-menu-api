module.exports = AuthController;

var http = require('http'),
    db = require('../db'),
    ApiController = require("./api_controller"),
    UserModel = require('../models/user_model'),
    AccountModel = require('../models/account_model'),
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

    http.request(options, this._callback.bind(this)).end();
};

AuthController.prototype._callback = function (response) {
    var self = this;
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });
    response.on('end', function () {
        var data = JSON.parse(str);

        if (data['error']) {
            self.sendError(data['error']);
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
    });
};

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
    var expire_seconds = 1800; // 30 min
    
    db.memcached.set(token, {
        user_id: user._id,
        account_id: user.account_id
    }, expire_seconds, function (err) {
        if ( err ) console.error( err );
    });

    this._res.json({token: token});
};

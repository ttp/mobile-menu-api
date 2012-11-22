var db = require('../db'),
    Seq = require('seq');

var SessionSchema = new db.mongoose.Schema({
    token: String,
    data: String,
    updated: Number
});
var SessionModel = db.mongoose.model('session', SessionSchema);

var EXPIRE_SECONDS = 3600, // 1 hour
    UPDATE_TIMEOUT = 600; // each 10 min

function getTimestamp () {
    return parseInt(Date.now() / 1000);
}

var Session = {
    set : function (token, data, cb) {
        data.timestamp = getTimestamp();
        Seq()
            .par(function () {
                SessionModel.create({
                    token: token,
                    data: JSON.stringify(data),
                    updated: data.timestamp
                }, this);
            })
            .par(function () {
                db.memcached.set(token, data, EXPIRE_SECONDS, this);
            })
            .seq(function () {
                cb();
            })
            .catch(function (err) {
                console.error(err);
                cb(err);
            })
    },

    get : function (token, cb) {
        Seq()
            .seq(function () {
                db.memcached.get(token, this);
            })
            .seq(function (data) {
                var self = this;
                if (data) {
                    this(null, data);
                } else {
                    SessionModel.findOne({token: token}, function (err, row) {
                        var data = row ? JSON.parse(row.data) : row;
                        if (data && !err) { // row found so saving it to memcached before next step
                            db.memcached.set(token, data, EXPIRE_SECONDS, function (mErr) {
                                self(mErr, data);
                            });
                        } else {
                            self(err, data);
                        }
                    });
                }
            })
            .seq(function (data) {
                if (data) {
                    var diff = getTimestamp() - data.timestamp;
                    if (diff > UPDATE_TIMEOUT) {
                        Session.renew(token, data);
                    }
                }
                cb(null, data);
            })
            .catch(function (err) {
                console.error(err);
                cb(err);
            });
    },

    renew : function (token, data) {
        data.timestamp = getTimestamp();
        SessionModel.update({token: token},{ $set: { updated: data.timestamp } }).exec();
        db.memcached.set(token, data, EXPIRE_SECONDS, function () {});
    },

    remove : function (token, cb) {
        SessionModel.find({token: token}).exec();
        db.memcached.del(token, cb);
    }
};

module.exports = Session;
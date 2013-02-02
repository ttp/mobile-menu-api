function ApiController (options) {
    this._options = options;
    this._req = options.req;
    this._res = options.res;
    this._next = options.next;
}
module.exports = ApiController;

ApiController.prototype.hasParam = function (param) {
    return this._req.params.hasOwnProperty(param);
};

ApiController.prototype.getParam = function (param) {
    return this._req.params[param];
};

ApiController.prototype.requireUser = function () {
    if (this._req.session.user == undefined) {
        this._res.redirect('/');
        return false;
    }
    return true;
};

ApiController.prototype.before = false;

ApiController.prototype.sendError = function (error) {
    this._res.json({error: error});
};

ApiController.prototype.sendSuccess = function () {
    this._res.json({success: true});
};

ApiController.prototype._getCallback = function (error, row) {
    if (error) {
        console.log(error);
        this._res.json({'error': error.toString()});
    } else if (!row) {
        this._res.json({'error': 'not_found'});
    } else if (row.account_id != this._account_id) {
        this._res.json({'error': 'incorrect_account'});
    } else {
        this._res.json(row);
    }
};

/*ApiController.prototype = {
    requireUser : function () {
        if (this._req.session.user == undefined) {
            this._res.redirect('/');
            return false;
        }
        return true;
    },

    before : false,

    sendError: function (error) {
        this._res.json({error: error});
    },

    sendSuccess: function () {
        this._res.json({success: true});
    },

    _getCallback : function (error, row) {
        if (error) {
            console.log(error);
            this._res.json({'error': error.toString()});
        } else if (!row) {
            this._res.json({'error': 'not_found'});
        } else if (row.account_id != this._account_id) {
            this._res.json({'error': 'incorrect_account'});
        } else {
            this._res.json(row);
        }
    }
}*/
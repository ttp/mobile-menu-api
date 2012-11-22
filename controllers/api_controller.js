module.exports = ApiController;

function ApiController(options) {
    this._options = options;
    this._req = options.req;
    this._res = options.res;
    this._next = options.next;
}

ApiController.prototype = {
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
}
'use strict';

var RestServer = function() {

    this.config = require('../config');

    var restify = require('restify');
    this.router = restify.createServer();
    this.router.use(restify.bodyParser());
    this.router.use(restify.CORS());
    this.router.use(restify.fullResponse());

};

RestServer.prototype.start = function(onStart, onError) {

    var that = this;

    onStart = onStart || function() {};
    onError = onError || function() {};


    console.log('Database connection...');

    that.mongoose = require('mongoose/');

    that.db = that.mongoose.connection;
    that.mongoose.connect(that.config.db.auth);

    that.db.on('error', onError);

    that.db.once('open', function () {

        console.log('Database connected !');

        that.router.listen(that.config.port, function() {
            console.log('Server listening on port ' + that.config.port + '...');
            onStart();
        });

    });
};

module.exports = new RestServer();

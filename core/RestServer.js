'use strict';


var RestServer = function() {

    // Load configuration
    this.config = require('../config');

    // Configure restify server
    var restify = require('restify');
    var router = restify.createServer();
    router.use(restify.bodyParser());
    router.use(restify.CORS());
    router.use(restify.fullResponse());
    this.router = router;

    // Configure passport authentification
    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    passport.use(new LocalStrategy(
        function(username, password, done) {
            if (username === 'test' && password === 'test') {
                done(null, true);
            }
            else {
                done(null, false);
            }
        }
    ));
    this.passport = passport;
};

// Start rest server
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

'use strict';

/**
 * A simple and easy to configure rest server.
 *
 * options :
 *  useAuth (default: false) ; If true, the passport property will be defined
 *  database (default : mongodb) ; 'mongodb' or 'mysql'
 */
var RestServer = function(options) {

    options = options || {};

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
    if (options.useAuth) {
        var passport = require('passport');
        var sessions = require('client-sessions');

        router.use(sessions({ secret: this.config.sessionSecret }));
        router.use(passport.initialize());
        router.use(passport.session());

        passport.serializeUser(function(user, done) {
            done(null, user);
        });

        passport.deserializeUser(function(user, done) {
            done(null, user);
        });

        this.passport = passport;
        this.BasicStrategy = require('passport-http').BasicStrategy;
    }
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

module.exports = RestServer;

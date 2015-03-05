'use strict';

/**
 * A simple and easy to configure rest server.
 *
 * options :
 *  useAuth (default: false) ; If true, the passport property will be defined
 *  useMongo (default : false) ; If true, mongoConnection and mongoose will be defined
 *  useMysql (default : false) ; If true, mysqlConnection will be defined
 */
var RestServer = function(options) {

    options = options || {};

    this.useMongo = options.useMongo;
    this.useMysql = options.useMysql;

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

/**
 * Connect to database(s) and start rest server
 * @param  {function} onStart called when the databases are connected and the server is ready
 */
RestServer.prototype.start = function(onStart) {

    var that = this;

    onStart = onStart || function() {};

    console.log('Database connection...');

    if (that.useMongo) {

        console.log('MongoDB connection...');
        that.mongoose = require('mongoose/');
        that.mongoConnection = that.mongoose.connection;
        that.mongoose.connect(that.config.db.auth);

        that.mongoConnection.on('error', function(err) {
            console.error('MongoDB error');
            throw err;
        });

        that.mongoConnection.once('open', function () {

            console.log('MongoDB connected !');

            that.router.listen(that.config.port, function() {
                console.log('Server listening on port ' + that.config.port + '...');
                onStart();
            });

        });
    }
};

module.exports = RestServer;

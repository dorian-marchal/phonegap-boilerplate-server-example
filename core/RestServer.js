'use strict';

/**
 * A simple and easy to configure rest server.
 *
 * Server properties :
 *     this.config : loaded config
 *     this.router : express instance
 *
 * Server Options :
 *     useAuth (default: false) ; If true, the passport property will be defined
 *         this.passport : passport instance
 *         this.LocalStrategy : passport LocalStrategy
 *     useMongo (default : false) ; If true, mongoConnection and mongoose will be defined
 *         this.mongoose : Mongoose instance
 *         this.mongoConnection : MongoDb connection
 *     useMysql (default : false) ; If true, mysqlConnection will be defined
 *         that.mysql : Mysql module instance
 *         that.mysqlConnection : MySQL connection
 */
var RestServer = function(options) {

    options = options || {};

    this.useMongo = options.useMongo;
    this.useMysql = options.useMysql;

    // Load configuration
    this.config = require('../config');

    // Load node modules
    var express = require('express');
    var bodyParser = require('body-parser');
    var cors = require('cors');


    var router = express();

    router.use(cors({
        origin: this.config.corsOrigin,
        credentials: true,
    }));
    router.use(bodyParser.urlencoded({ extended: false }));

    // Configure passport authentification
    if (options.useAuth) {
        var passport = require('passport');
        var sessions = require('express-session');

        router.use(sessions({
            secret: this.config.sessionSecret,
            maxAge: null,
            resave: true,
            saveUninitialized: true,
        }));
        router.use(passport.initialize());
        router.use(passport.session());

        this.passport = passport;
        this.LocalStrategy = require('passport-local').Strategy;
    }

    this.router = router;
};

/**
 * Connect to database(s) and start rest server
 * @param  {function} onStart called when the databases are connected and the server is ready
 */
RestServer.prototype.start = function(onStart) {

    var that = this;

    onStart = onStart || function() {};

    var async = require('async');

    console.log('Database connection...');

    // Make a connection to the mongo database
    var connectMongo = function(callback) {
        console.log('MongoDB connection...');
        that.mongoose = require('mongoose/');
        that.mongoConnection = that.mongoose.connection;
        that.mongoose.connect(that.config.db.mongo.auth);

        that.mongoConnection.on('error', function(err) {
            console.error('MongoDB error');
            throw err;
        });

        that.mongoConnection.once('open', function () {
            console.log('MongoDB connected !');
            callback(null);
        });
    };

    // Make a connection to the mysql database
    var connectMysql = function(callback) {
        console.log('MySQL connection...');
        that.mysql = require('mysql');

        that.mysqlConnection = that.mysql.createConnection({
            host : that.config.db.mysql.host,
            user : that.config.db.mysql.username,
            password : that.config.db.mysql.password,
            database : that.config.db.mysql.database,
        });

        that.mysqlConnection.connect(function(err) {
            if (err) {
                console.error('MySQL error');
                throw err;
            }

            console.log('MySQL connected !');
            callback(null);
        });
    };

    var dbConnections = {};

    if (that.useMongo) {
        dbConnections.mongo = connectMongo;
    }
    if (that.useMysql) {
        dbConnections.mysql = connectMysql;
    }

    async.parallel(dbConnections, function(err) {

        if (err) {
            throw err;
        }

        that.router.listen(that.config.port, function() {
            console.log('Server listening on port ' + that.config.port + '...');
            onStart();
        });

    });

};

module.exports = RestServer;

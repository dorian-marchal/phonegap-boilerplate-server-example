'use strict';

/**
 * A simple and easy to configure rest server.
 *
 * Server properties :
 *     this.config : loaded config
 *     this.router : express instance
 *
 * Server Options :
 *     useMongo (default : false) ; If true, mongoConnection and mongoose will be defined
 *         this.app.set('mongoose') : Mongoose instance
 *     useMysql (default : false) ; If true, mysqlConnection will be defined
 *         that.app.set('mysql') : Mysql module instance
 *         that.app.set('mysqlConnection') : MySQL connection
 */
var RestServer = function(options) {

    options = options || {};

    this.useMongo = options.useMongo || false;
    this.useMysql = options.useMysql || false;

    // Load configuration
    this.config = require('../config');

    // Load node modules
    var express = require('express');
    var bodyParser = require('body-parser');
    var cors = require('cors');


    var app = express();

    app.use(cors({
        origin: this.config.corsOrigin,
    }));
    app.use(bodyParser.urlencoded({ extended: false }));

    this.app = app;
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

        var mongoose = require('mongoose/');
        var connection = mongoose.connection;
        mongoose.connect(that.config.db.mongo.auth);

        that.app.set('mongoose', mongoose);

        connection.on('error', function(err) {
            console.error('MongoDB error');
            throw err;
        });

        connection.once('open', function () {
            console.log('MongoDB connected !');
            callback(null);
        });
    };

    // Make a connection to the mysql database
    var connectMysql = function(callback) {
        console.log('MySQL connection...');

        var mysql = require('mysql');

        var mysqlConnection = mysql.createConnection({
            host : that.config.db.mysql.host,
            user : that.config.db.mysql.username,
            password : that.config.db.mysql.password,
            database : that.config.db.mysql.database,
        });

        that.app.set('mysql', mysql);
        that.app.set('mysqlConnection', mysqlConnection);

        mysqlConnection.connect(function(err) {
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

        that.app.listen(that.config.port, function() {
            console.log('Server listening on port ' + that.config.port + '...');
            onStart();
        });

    });

};

module.exports = RestServer;

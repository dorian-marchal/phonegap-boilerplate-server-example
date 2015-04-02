'use strict';

/**
 * Add authentification fonctionnality to the server
 *
 * Usage :
 *
 * var auth = require('Authentification');
 * auth.addTo(server);
 *
 * auth.findUserByToken = function(token, done) {
 *
 *      // Code to search user by token
 *
 *      // Error
 *      done('Error description');
 *
 *      // User found
 *      done(null, user);
 * };
 *
 * auth.findUserByUsernameAndPassword = function(username, password, done) {
 *
 *      // Code to search user by username/password
 *
 *      // Error
 *      done('Error description');
 *
 *      // User found
 *      done(null, user);
 * };
 *
 * auth.updateUserToken = function(user, token, done) {
 *
 *      // Code to update user token
 *
 *      // Error case
 *      done('Error description');
 *
 *      // Success case
 *      done();
 *
 * };
 *
 */
var Authentication = function() {

    var that = this;

    var passport = require('passport');
    var uuid = require('node-uuid');

    this.addTo = function(server) {

        server.passport = passport;

        server.router.use(server.passport.initialize());

        server.BearerStrategy = require('passport-http-bearer').Strategy;

        server.passport.use(new server.BearerStrategy(
            function(token, done) {

                that.findUserByToken(token, function(err, user) {
                    if (err) {
                        done('Find user by token failed.');
                        return;
                    }
                    if (!user) {
                        done('No user for this token');
                        return;
                    }

                    return done(null, user);
                });

            }
        ));

        server.authenticateMiddleware = server.passport.authenticate('bearer', { session : false });

        /**
         * Check if User exists based on username/password
         */
        var loginMiddleware = function(req, res, next) {

            // username or password missing
            if (!(req.body.username && req.body.password)) {
                res.sendStatus(401);
                return;
            }

            that.findUserByUsernameAndPassword(req.body.username, req.body.password, function(err, user) {

                if (err || !user) {
                    res.sendStatus(401);
                    return;
                }

                req.user = user;
                next();
            });
        };

        /**
         * Update the token of the req.user and set the req.user.token var
         */
        var updateTokenMiddleware = function(req, res, next) {

            if (!req.user) {
                res.sendStatus(500);
                return console.error('req.user not set.');
            }

            var newToken = uuid.v4();

            that.updateUserToken(req.user, newToken, function(err) {
                if (err) {
                    res.sendStatus(500);
                    return console.error('User token update failed.');
                }

                next();
            });

        };

        /**
         * Null the token of the req.user
         */
        var clearTokenMiddleware = function(req, res, next) {

            if (!req.user) {
                res.sendStatus(500);
                return console.error('req.user not set');
            }

            that.updateUserToken(req.user, null, function(err) {
                if (err) {
                    res.sendStatus(500);
                    return console.error('User token clearance failed.');
                }

                next();
            });
        };

        // Set up our routes and start the server
        server.router.post('/login', loginMiddleware, updateTokenMiddleware, function(req, res) {
            res.send(req.user.token);
        });

        server.router.post('/logout', server.authenticateMiddleware, clearTokenMiddleware, function(req, res) {
            req.logout();
            res.sendStatus(200);
        });

        // Send status 200 if the user is authentificated. Else send 401 status.
        server.router.get('/logged-in', server.authenticateMiddleware, function(req, res) {
            res.sendStatus(200);
        });
    };

    /**
     * Retrieve a User based on a token
     * See the top of the file for more informations
     */
    this.findUserByToken = function() {
        throw new Error('Authentication.findUserByToken must be overriden.');
    };

    /**
     * Retrieve a User based on a username and a password
     * See the top of the file for more informations
     */
    this.findUserByUsernameAndPassword = function() {
        throw new Error('Authentication.findUserByUsernameAndPassword must be overriden.');
    };

    /**
     * Update the user token
     * See the top of the file for more informations
     */
    this.updateUserToken = function() {
        throw new Error('Authentication.updateUserToken must be overriden.');
    };
};

module.exports = new Authentication();


'use strict';

var RestServer = require('../core/RestServer');
var auth = require('../core/server_modules/Authentication');
var config = require('../config');

var server = new RestServer({
    useMongo: config.databaseEngine === 'mongodb',
    useMysql: config.databaseEngine === 'mysql',
});

auth.addTo(server);

function onStart() {

    var mongoAuth = function () {

        var mongoose = server.app.get('mongoose');

        // Configure the authentification
        var UserSchema = new mongoose.Schema({
            token: String,
            username: String,
            password: String,
        }, {
            collection: 'User',
        });

        var User = mongoose.model('User', UserSchema);

        auth.findUserByToken = function(token, done) {

            User.findOne(
                {
                    token: token
                },
                function(err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done('Incorrect token.');
                    }
                    return done(null, user);
                }
            );
        };

        auth.findUserByUsernameAndPassword = function(username, password, done) {

            User.findOne(
                {
                    username: username,
                    password: password,
                },
                function(err, user) {

                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done();
                    }

                    done(null, user);
                }
            );
        };

        auth.updateUserToken = function(user, token, done) {

            user.token = token;

            user.save(function(err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        };

        var MyModelSchema = new mongoose.Schema({
            attribute: String,
            attribute2: Number,
            date: Date
        });

        mongoose.model('MyModel', MyModelSchema);
        var MyModel = mongoose.model('MyModel');

        return {
            getMyModels: function (req, res) {

                MyModel
                    .find()
                    .sort({
                        date: 'desc'
                    })
                    .exec(function (err, data) {
                        if (err) {
                            return console.error(err);
                        }
                        res.send(data);
                    })
                ;
            },

            postMyModel: function(req, res) {

                var mymodel = new MyModel();

                if (req.body.attribute) {
                    mymodel.attribute = req.body.attribute;
                }
                else {
                    mymodel.attribute = 'default attribute';
                }

                if (req.body.attribute2) {
                    mymodel.attribute2 = req.body.attribute2;
                }
                else {
                    mymodel.attribute2 = -1;
                }

                mymodel.date = new Date();

                mymodel.save(function (err) {
                    if (err) {
                        return console.error(err);
                    }
                    res.send(req.body);
                });
            },
        };
    };

    var mysqlAuth = function () {

        var knex = require('../core/server_modules/bookshelf').knex;

        auth.findUserByToken = function(token, done) {

            var kFindByToken = knex('user').where('token', '=', token);

            kFindByToken
                .then(function (rows) {
                    if (rows.length > 0) {
                        return done(null, rows[0]);
                    }
                    else {
                        return done(new Error('Incorrect token.'));
                    }
                    return;
                })
                .catch(function (err) {
                    console.error(err.message);
                    done(err);
                })
            ;
        };

        auth.findUserByUsernameAndPassword = function(username, password, done) {

            var kFindByUsernameAndPassword = knex('user')
                .where('username', '=', username)
                .andWhere('password', '=', password)
            ;

            kFindByUsernameAndPassword
                .then(function (rows) {
                    if (rows.length > 0) {
                        return done(null, rows[0]);
                    }
                    else {
                        return done(new Error('Incorrect username/password.'));
                    }
                    return;
                })
                .catch(function (err) {
                    console.error(err.message);
                    done(err);
                })
            ;
        };

        auth.updateUserToken = function(user, token, done) {

            user.token = token;

            var kUpdateToken = knex('user')
                .where({id_user: user.id_user})
                .update({token: token})
            ;

            kUpdateToken
                .then(function() {
                    done();
                })
                .catch(function (err) {
                    return done(err);
                })
            ;
        };

        return {
            getMyModels: function (req, res) {

                knex('mymodel')
                    .then(function (rows) {
                        res.send(rows);
                        return;
                    })
                    .catch(function (err) {
                        return console.error(err);
                    })
                ;
            },

            postMyModel: function(req, res) {

                var kSave = knex('mymodel').insert({
                    attribute: req.body.attribute || 'default attribute',
                    attribute2: req.body.attribute2 || 0,
                });

                kSave
                    .then(function () {
                        res.send(req.body);
                        return;
                    })
                    .catch(function (err) {
                        return console.error(err);
                    })
                ;
            },
        };
    };

    var authData = server.config.databaseEngine === 'mysql' ? mysqlAuth() : mongoAuth();

    server.app.get('/mymodels', server.requireAuthentication, authData.getMyModels);
    server.app.post('/mymodels', server.requireAuthentication, authData.postMyModel);

}

function onError() {
    console.error('Connection error !');
}

server.start(onStart, onError);

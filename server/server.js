'use strict';

var RestServer = require('../core/RestServer');
var auth = require('../core/server_modules/Authentication');

var server = new RestServer({
    useMongo: true,
});

auth.addTo(server);

function onStart() {

    // Configure the authentification
    var UserSchema = new server.mongoose.Schema({
        token: String,
        username: String,
        password: String,
    }, {
        collection: 'User',
    });


    var User = server.mongoose.model('User', UserSchema);

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


    var MyModelSchema = new server.mongoose.Schema({
        attribute: String,
        attribute2: Number,
        date: Date
    });

    server.mongoose.model('MyModel', MyModelSchema);
    var MyModel = server.mongoose.model('MyModel');

    function getMyModels(req, res) {

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
    }

    function postMyModel(req, res) {

        var mymodel = new MyModel();

        if (req.params.attribute) {
            mymodel.attribute = req.params.attribute;
        }
        else {
            mymodel.attribute = 'default attribute';
        }

        if (req.params.attribute2) {
            mymodel.attribute2 = req.params.attribute2;
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
    }

    server.router.get('/mymodels', server.authenticateMiddleware, getMyModels);
    server.router.post('/mymodels', server.authenticateMiddleware, postMyModel);

}

function onError() {
    console.error('Connection error !');
}

server.start(onStart, onError);

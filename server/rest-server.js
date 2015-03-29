'use strict';

var RestServer = require('../core/RestServer');

var server = new RestServer({
    useAuth: true,
    useMongo: true,
    useMysql: true,
});

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

    server.passport.use(new server.BearerStrategy(
        function(token, done) {

            if (!token) {
                return done('Falsy token.');
            }

            User.findOne({ token: token }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, { message: 'Incorrect token.' });
                }
                return done(null, user);
            });
          }
    ));

    var bearerAuthenticateMiddleware = server.passport.authenticate('bearer', { session : false});

    /**
     * Check if User exists based on username/password
     */
    var loginMiddleware = function(req, res, next) {

        // username or password missing
        if (!(req.body.username && req.body.password)) {
            res.sendStatus(401);
            return;
        }

        User.findOne(
            {
                username: req.body.username,
                password: req.body.password,
            },
            function(err, user) {

                if (err) {
                    res.sendStatus(500);
                    return;
                }
                if (!user) {
                    res.sendStatus(401);
                    return;
                }

                req.user = user;
                next();
            }
        );
    };

    /**
     * Update the token of the req.user and set the req.user.token var
     */
    var updateTokenMiddleware = function(req, res, next) {

        if (!req.user) {
            res.sendStatus(500);
            return console.error('req.user not set');
        }

        req.user.token = server.uuid.v4();

        req.user.save(function(err) {
            if (err) {
                return console.error(err);
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

        req.user.token = null;

        req.user.save(function(err) {
            if (err) {
                return console.error(err);
            }
            next();
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

    // Set up our routes and start the server
    server.router.post('/login', loginMiddleware, updateTokenMiddleware, function(req, res) {
        res.send(req.user.token);
    });

    server.router.post('/logout', bearerAuthenticateMiddleware, clearTokenMiddleware, function(req, res) {
        req.logout();
        res.sendStatus(200);
    });

    // Send status 200 if the user is authentificated. Else send 401 status.
    server.router.get('/logged-in', bearerAuthenticateMiddleware, function(req, res) {
        res.sendStatus(200);
    });
    server.router.get('/mymodels', bearerAuthenticateMiddleware, getMyModels);
    server.router.post('/mymodels', bearerAuthenticateMiddleware, postMyModel);

}

function onError() {
    console.error('Connection error !');
}

server.start(onStart, onError);

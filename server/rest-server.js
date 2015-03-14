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
        username: String,
        password: String,
    }, {
        collection: 'User',
    });


    var User = server.mongoose.model('User', UserSchema);

    server.passport.use(new server.LocalStrategy(
        function(username, password, done) {
            console.log(username, password);
            User.findOne({ username: username }, function(err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (user.password !== password) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
          }
    ));

    server.passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    server.passport.deserializeUser(function(id, done) {
        console.log(id);
        User.findById(id, function(err, user) {
            console.log(user);
            done(err, user);
        });
    });


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

    function ensureAuthentication(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        else {
            console.log('User not logged in');
            res.sendStatus(401);
        }
    }

    // Set up our routes and start the server
    server.router.post('/login', server.passport.authenticate('local'), function(req, res) {
        res.sendStatus(200);
    });

    // Send status 200 if the user is authentificated. Else send 401 status.
    server.router.post('/logged-in', ensureAuthentication, function(req, res) {
        res.sendStatus(200);
    });
    server.router.get('/mymodels', ensureAuthentication, getMyModels);
    server.router.post('/mymodels', ensureAuthentication, postMyModel);

}

function onError() {
    console.error('Connection error !');
}

server.start(onStart, onError);

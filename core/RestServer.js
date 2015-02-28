module.exports = function() {
    'use strict';

    var restify = require('restify');
    var server = restify.createServer();
    server.use(restify.bodyParser());
    server.use(restify.CORS());
    server.use(restify.fullResponse());

    var mongoose = require('mongoose/');
    var config = require('../config');

    console.log('Database connection...');

    mongoose.connect(config.creds.auth);

    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function (callback) {

        console.log('Database connected !');

        var MyModelSchema = new mongoose.Schema({
            attribute: String,
            attribute2: Number,
            date: Date
        });

        mongoose.model('MyModel', MyModelSchema);
        var MyModel = mongoose.model('MyModel');

        function getMyModels(req, res, next) {

            MyModel
                .find()
                .sort({
                    date: 'desc'
                })
                .exec(function (err, data) {
                    if (err) return console.error(err);
                    res.send(data);
                })
            ;
        }

        function postMyModel(req, res, next) {

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

            mymodel.save(function (err, mymodel) {
                if (err) return console.error(err);
                res.send(req.body);
            });
        }

        console.log('Setting up server...');

        // Set up our routes and start the server
        server.get('/mymodels', getMyModels);
        server.post('/mymodels', postMyModel);

        server.listen(8080, function() {
          console.log('Server listening on port 8080...');
        });

    });
};

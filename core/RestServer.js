'use strict';

var RestServer = function() {

    this.config = require('../config');

    var restify = require('restify');
    this.server = restify.createServer();
    this.server.use(restify.bodyParser());
    this.server.use(restify.CORS());
    this.server.use(restify.fullResponse());

};

RestServer.prototype.start = function() {

    var that = this;

    console.log('Database connection...');

    var mongoose = require('mongoose/');

    that.db = mongoose.connection;
    mongoose.connect(that.config.creds.auth);

    that.db.on('error', console.error.bind(console, 'connection error: '));

    that.db.once('open', function (callback) {

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
                    if (err) {
                        return console.error(err);
                    }
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
                if (err) {
                    return console.error(err);
                }
                res.send(req.body);
            });
        }

        console.log('Setting up server...');

        // Set up our routes and start the server
        that.server.get('/mymodels', getMyModels);
        that.server.post('/mymodels', postMyModel);

        that.server.listen(8080, function() {
          console.log('Server listening on port 8080...');
        });

    });
};

module.exports = new RestServer();

'use strict';

var server = require('../core/RestServer');

function onStart() {

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
    server.router.get('/mymodels', function(req, res, next) {
        console.log('get :)');
        next();
    }, getMyModels);
    server.router.post('/mymodels', postMyModel);
}

function onError() {
    console.error('Connection error !');
}

server.start(onStart, onError);

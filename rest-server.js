'use strict';

var restify = require('restify');
var server = restify.createServer();
server.use(restify.bodyParser());

var mongoose = require('mongoose/');
var config = require('./config');

console.log('Database connection...');

var db = mongoose.connect(config.creds.auth);

var MyModelSchema = new mongoose.Schema({
    message: String,
    date: Date
});

mongoose.model('MyModel', MyModelSchema);
var MyModel = mongoose.model('MyModel');

// This function is responsible for returning all entries for the Message model
function getMyModels(req, res, next) {
  // .find() without any arguments, will return all results
  // the `-1` in .sort() means descending order
  MyModel.find().sort({ date: 'desc' }).execFind(function (arr,data) {
    res.send(data);
  });
}



function postMyModel(req, res, next) {

  // Create a new MyModel model, fill it up and save it to Mongodb
  var mymodel = new MyModel();
  mymodel.message = req.params.message;
  mymodel.date = new Date();
  mymodel.save(function () {
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

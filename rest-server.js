var restify = require('restify');
var server = restify.createServer();
server.use(restify.bodyParser());

var mongoose = require('mongoose/');
var config = require('./config');

var db = mongoose.connect(config.creds.auth);

var MyModelSchema = new mongoose.Schema({
    message: String,
    date: Date
});

mongoose.model('MyModel', MyModelSchema);
var MyModel = mongoose.model('MyModel');

// This function is responsible for returning all entries for the Message model
function getMessages(req, res, next) {
  // Resitify currently has a bug which doesn't allow you to set default headers
  // This headers comply with CORS and allow us to server our response to any origin
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // .find() without any arguments, will return all results
  // the `-1` in .sort() means descending order
  Message.find().sort('date', -1).execFind(function (arr,data) {
    res.send(data);
  });
}



function postMessage(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  // Create a new message model, fill it up and save it to Mongodb
  var message = new Message();
  message.message = req.params.message;
  message.date = new Date();
  message.save(function () {
    res.send(req.body);
  });
}

// Set up our routes and start the server
server.get('/messages', getMessages);
server.post('/messages', postMessage);

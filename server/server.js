'use strict';

var RestServer = require('../core/RestServer');

var server = new RestServer({
    useMongo: false,
    useMysql: false,
});

var onStart = function() {

    server.router.get('/', function(req, res) {
        res.send('Yup. It works.');
    });
};

server.start(onStart);

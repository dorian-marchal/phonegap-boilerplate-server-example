'use strict';

var server = require('../core/RestServer');

function onStart() {

}

function onError() {
    console.error('Connection error !');
}

server.start(onStart, onError);

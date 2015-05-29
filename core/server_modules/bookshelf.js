'use strict';

var config = require('../../config');

var knex = require('../node_modules/knex')({
    client: 'mysql',
    connection: {
        host : config.db.mysql.host,
        user : config.db.mysql.username,
        password : config.db.mysql.password,
        database : config.db.mysql.database,
        charset : 'utf8'
    }
});

var bookshelf = require('bookshelf')(knex);

bookshelf.plugin('registry');

module.exports = bookshelf;

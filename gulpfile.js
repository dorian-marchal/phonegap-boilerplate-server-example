'use strict';

var gulp  = require('gulp');
var nodemon  = require('gulp-nodemon');

gulp.task('start', function () {
    nodemon({
        script: 'server/server.js',
    });
});

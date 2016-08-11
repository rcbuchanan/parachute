'use strict';

var browserify = require('browserify');
//var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');

gulp.task('javascript', function () {
    var b = browserify({
	entries: ["./main.js"],
	debug: false,
    });
    
    return b.bundle()
	.pipe(source('parachute.js'))
	.pipe(buffer())
	//.pipe(uglify())
	.pipe(gulp.dest('dist'));
});

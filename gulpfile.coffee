gulp        = require 'gulp'
connect = require 'gulp-connect'

gulp.task 'connect', ->
	connect.server 
		port: 8080
		livereload: on
		root: [__dirname]

gulp.task 'html', ->
	gulp.src 'index.html'
		.pipe do connect.reload

gulp.task 'watch', ->
	gulp.watch 'coffee/*.coffee'
	gulp.watch 'index.html', ['html']

gulp.task 'default', ['connect', 'watch']

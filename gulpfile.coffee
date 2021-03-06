gulp        = require 'gulp'
connect = require 'gulp-connect'
coffee    = require 'gulp-coffee'
rjs	 	 = require 'gulp-requirejs'
uglify 	 = require 'gulp-uglify'
clean 	 = require 'gulp-clean'
ftp 		 = require 'vinyl-ftp'
gutil 	=  require 'gulp-util'

gulp.task 'connect', ->
	connect.server 
		port: 8080
		livereload: on
		root: [__dirname]

gulp.task 'coffee', ->
	gulp.src 'coffee/*.coffee'
		.pipe do coffee
		.pipe gulp.dest 'scripts/'

gulp.task 'build', ['coffee'], ->
	rjs
		baseUrl: 'scripts/'
		name: '../bower_components/almond/almond'
		include: ['main']
		insertRequire: ['main']
		out: 'all.js'
		wrap: on
	#.pipe do uglify
	.pipe gulp.dest 'js/'
	.pipe do connect.reload

	gulp.src 'scripts'
		.pipe do clean
	
gulp.task 'watch', ->
	gulp.watch 'coffee/*.coffee', ['build']
	gulp.watch 'index.html', -> do connect.reload
	gulp.watch 'css/*.css', -> do connect.reload

gulp.task 'prod', ->
	conn = ftp.create {
		host: 'blake.beget.ru',
		user: 'mortraei',
		password: 'rOaAPr14',
		parrallel: 10,
		log: gutil.log
	}

	globs = [
		'bower_components/**',
		'css/**',
		'img/**',
		'js/**',
		'index.html'
	]

	gulp.src globs, {base: '.', buffer: false}
		.pipe conn.newer '/mortraei.bget.ru/public_html'
		.pipe conn.dest '/mortraei.bget.ru/public_html'

gulp.task 'default', ['connect', 'watch', 'build']
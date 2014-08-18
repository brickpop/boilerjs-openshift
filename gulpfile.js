// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    jade = require('gulp-jade'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    htmlmin = require('gulp-htmlmin'),
    mocha = require('gulp-mocha'),
    shell = require('gulp-shell'),
    nodemon = require('gulp-nodemon');


// Media
gulp.task('images', function() {
  return gulp.src('www/media/**/*.jpg', 'www/media/**/*.jpeg', 'www/media/**/*.png', 'www/media/**/*.gif', 'www/media/**/*.tiff')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('public/media'));
});

// STYLE
gulp.task('scss', function() {
  return gulp.src(['www/styles/index.scss', 'www/styles/dashboard/*.css', 'www/styles/themes/blue.css'])
    .pipe(sass())
    .pipe(concat('index.css'))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 2.3'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('public/styles'));
});

// MARKUP
gulp.task('jade', function() {
  var localSymbols = {};

  return gulp.src('www/**/*.jade')
  .pipe(jade({
    locals: localSymbols
  }))
  .pipe(gulp.dest('public/'))
});

gulp.task('html', function() {
  return gulp.src(['www/**/*.html'])
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('public/'));
});

// JAVASCRIPT
gulp.task('jshint', function() {
  return gulp.src(['app.js', 'controllers/**/*.js', 'models/**/*.js', 'www/scripts/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'));
});

gulp.task('javascript', function() {
  return gulp.src(['www/scripts/**/*.js'])
    .pipe(concat('index.js'))
    .pipe(gulp.dest('public/scripts'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify({mangle: false}))
    .pipe(gulp.dest('public/scripts'));
});

// VENDOR
gulp.task('modernizr', function() {
  return gulp.src(['www/vendor/modernizr.min.js'])
    .pipe(gulp.dest('public/scripts'));
});

gulp.task('jsVendor', function() {
  gulp.src('www/vendor/*.map')
  .pipe(gulp.dest('public/scripts'));

  return gulp.src(['www/vendor/angular.min.js', 'www/vendor/angular-animate.min.js', 
    'www/vendor/angular-cookies.min.js', 'www/vendor/angular-route.min.js', 'www/vendor/ng-bootstrap-tpls.min.js'])
    .pipe(concat('vendor.min.js'))
    .pipe(gulp.dest('public/scripts'));
});

gulp.task('cssVendor', function() {
  return gulp.src(['www/vendor/**/*.css'])
    .pipe(concat('vendor.min.css'))
    .pipe(minifycss())
    .pipe(gulp.dest('public/styles'));
});

gulp.task('fontVendor', function() {
  return gulp.src(['www/fonts/*'])
    .pipe(gulp.dest('public/fonts'));
});

// Clean
gulp.task('clean', function() {
  return gulp.src(['public/*'], {read: false})
    .pipe(clean());
});

// Groups
gulp.task('vendor', function() {
  gulp.start('modernizr', 'jsVendor', 'cssVendor', 'fontVendor');
});

gulp.task('scripts', function() {
  gulp.start('jshint', 'javascript');
});

gulp.task('markup', function() {
  gulp.start('jade', 'html');
});

gulp.task('styles', function() {
  gulp.start('scss');
});

gulp.task('make', ['clean'], function() {
  gulp.start('scripts', 'markup', 'styles', 'images', 'vendor');
});

// Default task
gulp.task('default', function() {
  console.log("\nAvailable actions:\n");
  console.log("   $ gulp make");
  console.log("   $ gulp debug");
  console.log("   $ gulp test\n");
});

// MAIN TASKS
gulp.task('debug', ['make'], function () {
  nodemon({ script: 'app.js', ext: 'html jade js css scss ', ignore: ['public'] })
    .on('change', ['make'])
    .on('restart', function () {
      console.log('App restarted')
    })
});

gulp.task('test', ['make'], function () {
    gulp.src('test/index.js')
        .pipe(mocha({reporter: 'nyan'}));
});

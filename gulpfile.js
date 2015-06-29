const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const fs = require('fs');
const del = require('del');
const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const babel = require('gulp-babel');
const babelify = require('babelify');
const isparta = require('isparta');
const esperanto = require('esperanto');
const browserify = require('browserify');
const runSequence = require('run-sequence');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps')

const manifest = require('./package.json');
const config = manifest.babelBoilerplateOptions;
const mainFile = manifest.main;
const destinationFolder = path.dirname(mainFile);
const exportFileName = path.basename(mainFile, path.extname(mainFile));

// Remove the built files
gulp.task('clean', function(cb) {
    del([destinationFolder], cb);
});

// Remove our temporary files
gulp.task('clean-tmp', function(cb) {
    del(['tmp'], cb);
});

// Send a notification when JSRC fails,
// so that you know your changes didn't build
function jscsNotify(file) {
    if (!file.jscs) { return; }
    return file.jscs.success ? false : 'JSRC failed';
}

function createLintTask(taskName, files) {
    gulp.task(taskName, function() {
        return gulp.src(files)
            .pipe($.plumber())
            .pipe($.eslint())
            .pipe($.eslint.format())
            .pipe($.eslint.failOnError())
            .pipe($.jscs())
            .pipe($.notify(jscsNotify));
    });
}

// Lint our source code
createLintTask('lint-src', ['src/**/*.js']);

// Lint our test code
createLintTask('lint-test', ['test/**/*.js']);

// Build two versions of the library
gulp.task('build', ['lint-src', 'clean'], function(done) {
    gulp.src("src/bean.js")
        .pipe(sourcemaps.init())
        .pipe(babel({
            experimental: true,
            optional: ['es7.decorators'],
            plugins: ['object-assign']
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/'));
});

// Bundle our app for our unit tests
gulp.task('browserify', function() {
    var testFiles = glob.sync('./test/unit/**/*');
    var allFiles = ['./test/setup/browserify.js'].concat(testFiles);
    var bundler = browserify(allFiles);
    bundler.transform(babelify.configure({
        sourceMapRelative: __dirname + '/src',
        optional: ['es7.decorators'],
        blacklist: ['useStrict']
    }));
    return bundler.bundle()
        .on('error', function(err){
            console.log(err.message);
            this.emit('end');
        })
        .pipe($.plumber())
        .pipe(source('./tmp/__spec-build.js'))
        .pipe(gulp.dest(''))
        .pipe($.livereload());
});

function test() {
    return gulp.src(['test/setup/node.js', 'test/unit/**/*.js'], {read: false})
        .pipe($.mocha({reporter: 'dot', globals: config.mochaGlobals}));
}

gulp.task('coverage', ['lint-src', 'lint-test'], function(done) {
    require('babel/register');
    gulp.src(['src/**/*.js'])
        .pipe($.istanbul({ instrumenter: isparta.Instrumenter }))
        .pipe($.istanbul.hookRequire())
        .on('finish', function() {
            return test()
                .pipe($.istanbul.writeReports())
                .on('end', done);
        });
});

// Lint and run our tests
gulp.task('test', ['lint-src', 'lint-test'], function() {
    require('babel/register')({
        experimental: true,
        optional: ['es7.decorators']
    });
    return test();
});

// Ensure that linting occurs before browserify runs. This prevents
// the build from breaking due to poorly formatted code.
gulp.task('build-in-sequence', function(callback) {
    runSequence(['lint-src', 'lint-test'], 'browserify', callback);
});

const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc', '.jscsrc'];

// Run the headless unit tests as you make changes.
gulp.task('watch', function() {
    gulp.watch(watchFiles, ['test']);
});

// Set up a livereload environment for our spec runner
gulp.task('test-browser', ['build-in-sequence'], function() {
    $.livereload.listen({port: 35729, host: 'localhost', start: true});
    return gulp.watch(watchFiles, ['build-in-sequence']);
});

// An alias of test
gulp.task('default', ['test']);

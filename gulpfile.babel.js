'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {stream as wiredep} from 'wiredep';
import compress from 'compression';

import ftp from 'vinyl-ftp';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const packageJson = require( './package.json' );
const testLintOptions = {
  env: {
    mocha: true
  }
};

function lint( files, options ) {
  return () => {
    return gulp.src( files )
      .pipe( reload( { stream: true, once: true } ) )
      .pipe( $.eslint( options ) )
      .pipe( $.eslint.format() )
      .pipe( $.if( !browserSync.active, $.eslint.failAfterError() ) );
  };
}

/*!
 * Gulp plugin to preprocess HTML, JavaScript, and other files based
 * on custom context or environment configuration
 * https://github.com/jas/gulp-preprocess
 */
gulp.task( 'templates', () => {
  return gulp.src( ['src/_templates/**/*.html', '!src/_templates/components/**/*'] )
    .pipe( $.preprocess( { context: packageJson } ) )
    .pipe( gulp.dest( 'src' ) );
});

gulp.task( 'styles', [ 'templates' ], () => {
  return gulp.src( 'src/styles/*.scss' )
    .pipe( $.plumber() )
    .pipe( $.sourcemaps.init() )
    .pipe( $.sass.sync( {
      outputStyle: 'expanded',
      precision: 10,
      includePaths: [ '.' ]
    } ).on( 'error', $.sass.logError) )
    .pipe( $.autoprefixer( { browsers: [ 'last 3 version' ] } ) )
    .pipe( $.sourcemaps.write( './' ) )
    .pipe( gulp.dest( '.tmp/styles' ) )
    .pipe(reload( { stream: true } ) );
});

gulp.task( 'lint', lint( 'src/scripts/**/*.js' ) );
gulp.task( 'lint:test', lint( 'test/spec/**/*.js', testLintOptions ) );

gulp.task( 'html', [ 'styles' ], () => {
  
  return gulp.src( 'src/*.html' )
    .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
    .pipe( $.if( '*.js', $.uglify() ) )
    .pipe( $.if( '*.css', $.minifyCss( {compatibility: '*'} ) ) )
    .pipe( $.if( '*.html', $.minifyHtml( { conditionals: true, loose: true } ) ) )
    .pipe( gulp.dest( 'dist' ) );
});

gulp.task( 'images', () => {
  return gulp.src( 'src/images/**/*' )
    .pipe( $.if($.if.isFile, $.cache($.imagemin( {
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [ { cleanupIDs: false } ]
    } ) )
    .on( 'error', function ( err ) {
      console.log( err );
      this.end();
    } ) ) )
    .pipe( gulp.dest( 'dist/images' ) );
});


/*! 
 * Favicons generator for Gulp
 * https://github.com/haydenbleasel/gulp-favicons
 */
gulp.task( 'favicons', () => {
  del.sync( [ 'src/images/favicons/**' ] );
  require( 'fs' ).writeFile( 'src/_templates/components/_head/favicons.html', '', function( err ) {
    if ( err ) throw err;
  } );
  return gulp.src( packageJson.config.faviconPath )
    .pipe( $.favicons(
      {
        files: {
          src              : packageJson.config.faviconPath
        , dest             : 'images/favicons'
        , html             : 'src/_templates/components/_head/favicons.html'
        , iconsPath        : 'images/favicons'
        , androidManifest  : 'images/favicons'
        , browserConfig    : 'images/favicons'
        , firefoxManifest  : 'images/favicons'
        , yandexManifest   : 'images/favicons'
        }
      , icons: {
          android          : true
        , appleIcon        : true
        , appleStartup     : true
        , coast            : true
        , favicons         : true
        , firefox          : true
        , opengraph        : true
        , windows          : true
        , yandex           : true
      }
      , settings: {
          appName          : packageJson.config.projectName
        , appDescription   : packageJson.description
        , developer        : packageJson.config.developerName
        , developerURL     : packageJson.config.developerUrl
        , version          : packageJson.version
        , background       : packageJson.config.brandColor
        , index            : 'index.html'
        , url              : packageJson.homepage
        , silhouette       : true
        , logging          : false
        }
      }, function ( error, metadata ) {
          if ( error ) {
              throw error;
          }
          console.log( metadata, 'Metadata produced during the build process' );
      } ) );
});

gulp.task('sftp', function () {
  return gulp.src('dist/styles/*')
    .pipe( $.plumber() )
    .pipe( $.sftp( {
      host       : 'p299682.ftp.ihc.ru',
      user       : 'p299682_ganin',
      pass       : 'TvSCbqpmg2',
      port       : 21,
      remotePath : '/home/p299682/www/nevatrip.dev/src/styles/'
    } ) );
});

gulp.task('ftp', function () {

  var conn = ftp.create( {
    host:     'p299682.ftp.ihc.ru',
    user:     'p299682_ganin',
    password: 'TvSCbqpmg2',
    parallel: 10
  } );
 
  var globs = [
    'dist/styles/**',
    'dist/scripts/**'
  ];
 
  // using base = '.' will transfer everything to /public_html correctly 
  // turn off buffering in gulp.src for best performance 
 
  return gulp.src( globs, { base: '.', buffer: false } )
    .pipe( $.plumber() )
    .pipe( conn.newer( '/www/nevatrip.dev/src' ) )
    .pipe( conn.dest( '/www/nevatrip.dev/src' ) );

});

gulp.task( 'fonts', () => {
  return gulp.src( require( 'main-bower-files' )( {
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  } ).concat( 'src/fonts/**/*' ) )
    .pipe( gulp.dest( '.tmp/fonts' ) )
    .pipe( gulp.dest( 'dist/fonts' ) );
});

gulp.task( 'extras', () => {
  return gulp.src( [
    'src/*.*',
    '!src/*.html'
  ], {
    dot: true
  } ).pipe( gulp.dest( 'dist' ) );
});

gulp.task( 'clean', del.bind( null, [ '.tmp', 'dist' ] ) );

gulp.task( 'serve', [ 'styles', 'fonts' ], () => {
  browserSync( {
    notify    : false,
    port      : 9000,
    ghostMode : false,
    // open      : 'tunnel',
    // tunnel    : 'nevatripdev',
    server    : {
      baseDir : [ '.tmp', 'src' ],
      routes  : {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch( [
    'src/*.html',
    'src/scripts/**/*.js',
    'src/images/**/*',
    '.tmp/fonts/**/*'
  ] ).on( 'change', reload );

  gulp.watch( 'src/styles/**/*.scss', [ 'styles' ] );
  gulp.watch( 'src/fonts/**/*', [ 'fonts' ] );
  gulp.watch( 'bower.json', [ 'wiredep', 'fonts' ] );
  gulp.watch( 'src/_templates/**/*.html', [ 'templates' ] );
});

gulp.task( 'serve:dist', () => {
  browserSync( {
    notify    : false,
    port      : 9001,
    ghostMode : false,
    open      : 'tunnel',
    tunnel    : 'nevatrip',
    server    : {
      baseDir : [ 'dist' ],
      middleware: [compress()]
    }
  });
});

gulp.task( 'serve:test', () => {
  browserSync( {
    notify: false,
    port: 9003,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch( 'test/spec/**/*.js' ).on( 'change', reload );
  gulp.watch( 'test/spec/**/*.js', [ 'lint:test' ] );
});

// inject bower components
gulp.task( 'wiredep', () => {
  gulp.src( 'src/styles/*.scss' )
    .pipe( wiredep( {
      ignorePath: /^(\.\.\/)+/
    } ) )
    .pipe( gulp.dest( 'src/styles' ) );

  console.log('heh');
  gulp.src( 'src/_templates/**/*.html' )
    .pipe( $.plumber() )
    .pipe( wiredep( {
      exclude: [ 'bootstrap-sass' ],
      ignorePath: /^(\.\.\/)*\.\./
    } ) )
    .pipe( gulp.dest( 'src/_templates/' ) );
});

gulp.task( 'build', [ 'lint', 'html', 'images', 'fonts', 'extras' ], () => {
  return gulp.src( 'dist/**/*' )
    .pipe( $.size( { title: 'build', gzip: true } ) );
});

gulp.task( 'default', [ 'clean' ], () => {
  gulp.start( 'build' );
});

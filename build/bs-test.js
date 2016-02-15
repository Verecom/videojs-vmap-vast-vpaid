'use strict';

var gulp        = require('gulp');
var Server      = require('karma').Server;
var runSequence = require('run-sequence');

var config       = require('./config');
var BuildTaskDoc = require('./BuildTaskDoc');

/**
 * Run test once and exit
 */

var testTasks = [];
config.versions.forEach(function(version) {

  var testTask = 'bs-ci-test-videojs_' + version;
  var videoJs = config.versionsMap[version] + 'video.js';

  gulp.task(testTask, function (done) {
    new Server({
      configFile: __dirname + '/../karma.conf.js',
      files: [
        videoJs,
        'test/test-utils.css',
        'test/**/*.spec.js'
      ],
      autoWatch: false,
      singleRun: true,
      reporters: ['spec', 'coverage'],
      browserStack: {
        username: process.env.BROWSER_STACK_USERNAME,
        accessKey: process.env.BROWSER_STACK_ACCESS_KEY
      },
      customLaunchers: {
        bs_firefox_mac: {
          base: 'BrowserStack',
          browser: 'firefox',
          browser_version: '21.0',
          os: 'OS X',
          os_version: 'Mountain Lion'
        },
        bs_iphone5: {
          base: 'BrowserStack',
          device: 'iPhone 5',
          os: 'ios',
          os_version: '6.0'
        },
        bs_android_44:{
          base: 'BrowserStack',
          device: 'Samsung Galaxy S5',
          os: 'android',
          os_version: '4.4'
        }
      },
      browsers: ['bs_android_44'],
      coverageReporter: {
      reporters: [
        {
          type: 'text',
          dir: 'coverage/',
          file: 'coverage.txt'
        },
        {
          type: 'html',
          dir: 'coverage/'
        },
        {
          type: 'lcovonly',
          dir: 'coverage/',
          subdir: '.'
        },
        {type: 'text-summary'}
      ]
    }
    }, function (error) {
      done(error);
    }).start();
  });
  testTasks.push(testTask);
});


gulp.task('bs-test', function(done) {
  testTasks.push(function (error) {
      if(error){
        console.log(error.message.red);
      } else{
        console.log('TEST FINISHED SUCCESSFULLY'.green);
      }
      done(error);
    });
  runSequence.apply(this,testTasks);

});

module.exports = new BuildTaskDoc('bs-test', 'using browser stack to run ci-test', 6.1);

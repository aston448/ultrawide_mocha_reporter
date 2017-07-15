'use strict';

var _mocha = require('mocha');

var _mocha2 = _interopRequireDefault(_mocha);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = UltrawideMochaReporter;

function setDefaultOrSpecifiedOptions(options) {

    options = options || {};
    options = options.reporterOptions || {};
    options.resultsFile = options.resultsFile || 'test-results.json';
    options.consoleOutput = options.consoleOutput || 'RESULT';

    return options;
}

function UltrawideMochaReporter(runner, userOptions) {

    _mocha2.default.reporters.Base.call(this, runner);

    var self = this;
    var tests = [];
    var pending = [];
    var failures = [];
    var passes = [];
    var totalPasses = 0;
    var totalFailures = 0;

    var options = setDefaultOrSpecifiedOptions(userOptions);

    runner.on('suite', function (suite) {
        if (options.consoleOutput === 'ON' && suite.title !== '') {
            console.log('\nTEST SUITE: %s\n---------------------------------------------------------------------------------', suite.title);
        }
    });

    runner.on('pass', function (test) {
        passes.push(test);
        totalPasses++;

        if (options.consoleOutput === 'ON') {
            console.log("\x1b[32m  PASS: %s\x1b[0m", test.title);
        }
    });

    runner.on('fail', function (test, err) {
        failures.push(test);
        totalFailures++;

        if (options.consoleOutput === 'ON') {
            console.log("\x1b[31m  FAIL: %s\x1b[0m -- error: %s", test.title, err.message);
        }
    });

    runner.on('pending', function (test) {
        pending.push(test);

        if (options.consoleOutput === 'ON') {
            console.log("\x1b[34m  PENDING: %s\x1b[0m", test.title);
        }
    });

    runner.on('test end', function (test) {
        tests.push(test);
    });

    runner.on('end', function () {

        var obj = {
            stats: self.stats,
            pending: pending.map(createTestObject),
            passes: passes.map(createTestObject),
            failures: failures.map(createTestObject)
        };

        runner.testResults = obj;

        // Convert to JSON
        var jsonData = {};

        try {
            jsonData = JSON.stringify(obj, null, 2);
        } catch (e) {
            console.log('\x1b[31mFailed to parse tests into JSON.\x1b[0m  Error: %s', e.message);
            process.exit(1);
        }

        // Write to default or specified file
        try {
            _fs2.default.writeFileSync(options.resultsFile, jsonData);
            console.log('\nResults written to %s', options.resultsFile);
        } catch (e) {
            console.log('\n\x1b[31mFailed to write test output to %s.\x1b[0m  \nError: %s', options.resultsFile, e.message);
        }

        // Log the output file and final results unless absolutely no logging
        if (options.consoleOutput !== 'OFF') {
            console.log('\nTest run complete.');

            console.log('\n\x1b[34mFINAL SCORE: Passing: %d    Failing: %d\x1b[0m', totalPasses, totalFailures);
        }

        process.exit(0);
    });
}

function createTestObject(test) {
    return {
        title: test.title,
        fullTitle: test.fullTitle(),
        duration: test.duration,
        currentRetry: test.currentRetry(),
        err: errorJSON(test.err || {})
    };
}

function errorJSON(err) {
    var res = {};

    Object.getOwnPropertyNames(err).forEach(function (key) {
        res[key] = err[key];
    }, err);

    return res;
}
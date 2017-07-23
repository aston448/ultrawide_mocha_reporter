'use strict';

var _mocha = require('mocha');

var _mocha2 = _interopRequireDefault(_mocha);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = UltrawideMochaReporter;

function setDefaultOrSpecifiedOptions(options) {

    // Options can be entered as env vars or an options object depending on how the tests are run

    // See if env vars are being used
    var userOutputFile = process.env.OUTPUT_FILE;

    if (typeof userOutputFile !== 'undefined') {

        // Assume env var usage

        // Default values
        var outputFile = 'test_results.json';
        var consoleOption = 'RESULT';

        if (userOutputFile.length > 0) {
            outputFile = userOutputFile;
        }

        var userConsoleOption = process.env.CONSOLE;

        if (typeof userConsoleOption !== 'undefined') {
            consoleOption = userConsoleOption.toUpperCase();
        }

        var reporterOptions = {};
        reporterOptions.resultsFile = process.env.PWD + '/' + outputFile;
        reporterOptions.consoleOutput = consoleOption;

        return reporterOptions;
    } else {

        // Assume options object.  If that is null, create defaults.

        options = options || {};
        var _reporterOptions = options.reporterOptions || {};
        _reporterOptions.resultsFile = _reporterOptions.resultsFile || 'test-results.json';
        _reporterOptions.resultsFile = process.env.PWD + '/' + _reporterOptions.resultsFile;
        _reporterOptions.consoleOutput = _reporterOptions.consoleOutput || 'RESULT';

        return _reporterOptions;
    }
}

function UltrawideMochaReporter(runner, userOptions) {

    // Make sure that no suites bail out on errors.
    // Ultrawide always wants to know about all test results

    runner.suite.suites.forEach(function (suite) {
        suite.bail(false);
    });

    _mocha2.default.reporters.Base.call(this, runner);

    var self = this;
    var tests = [];
    var pending = [];
    var failures = [];
    var passes = [];
    var totalPasses = 0;
    var totalFailures = 0;

    var reporterOptions = setDefaultOrSpecifiedOptions(userOptions);

    runner.on('suite', function (suite) {

        //console.log("Suites: %d", suite.suites.length);

        if (reporterOptions.consoleOutput === 'ON' && suite.title !== '') {
            if (suite.suites.length > 0) {
                console.log('\n\x1b[34mSUITE : %s\x1b[0m\n\x1b[34m---------------------------------------------------------------------------------\x1b[0m', suite.title);
            } else {
                console.log('\nTEST : %s', suite.title);
            }
        }
    });

    runner.on('pass', function (test) {
        passes.push(test);
        totalPasses++;

        if (reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[32m  PASS: %s\x1b[0m", test.title);
        }
    });

    runner.on('fail', function (test, err) {
        failures.push(test);
        totalFailures++;

        if (reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[31m  FAIL: %s\x1b[0m -- error: %s", test.title, err.message);
        }
    });

    runner.on('pending', function (test) {
        pending.push(test);

        if (reporterOptions.consoleOutput === 'ON') {
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
            _fs2.default.writeFileSync(reporterOptions.resultsFile, jsonData);
            console.log('\nResults written to %s', reporterOptions.resultsFile);
        } catch (e) {
            console.log('\n\x1b[31mFailed to write test output to %s.\x1b[0m  \nError: %s', reporterOptions.resultsFile, e.message);
        }

        // Log the output file and final results unless absolutely no logging
        if (reporterOptions.consoleOutput !== 'OFF') {
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
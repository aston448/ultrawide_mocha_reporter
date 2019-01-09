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

        if (outputFile.startsWith('/')) {
            reporterOptions.resultsFile = process.env.PWD + outputFile;
        } else {
            reporterOptions.resultsFile = process.env.PWD + '/' + outputFile;
        }

        reporterOptions.consoleOutput = consoleOption;

        checkResultsDir(reporterOptions.resultsFile);

        return reporterOptions;
    } else {

        // Assume options object.  If that is null, create defaults.

        options = options || {};

        var _reporterOptions = options.reporterOptions || {};
        _reporterOptions.resultsFile = _reporterOptions.resultsFile || 'test-results.json';

        if (_reporterOptions.resultsFile.startsWith('/')) {
            _reporterOptions.resultsFile = process.env.PWD + _reporterOptions.resultsFile;
        } else {
            _reporterOptions.resultsFile = process.env.PWD + '/' + _reporterOptions.resultsFile;
        }

        _reporterOptions.consoleOutput = _reporterOptions.consoleOutput || 'RESULT';

        checkResultsDir(_reporterOptions.resultsFile);

        return _reporterOptions;
    }
}

function UltrawideMochaReporter(runner, userOptions) {

    // Make sure that no suites bail out on errors.
    // Ultrawide always wants to know about all test results

    // Goes down 3 levels of suites - all must be set or tests at that level don't run after a failure
    runner.suite.suites.forEach(function (suite) {
        //console.log('\nSetting %s to bail false', suite.title);
        suite.bail(false);
        suite.suites.forEach(function (suite) {
            //console.log('\nSetting %s to bail false', suite.title);
            suite.bail(false);
            suite.suites.forEach(function (suite) {
                //console.log('\nSetting %s to bail false', suite.title);
                suite.bail(false);
            });
        });
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

        // Categorise the output depending on the hierarchical level in the test file
        if (reporterOptions.consoleOutput === 'ON' && suite.title !== '') {
            if (suite.parent.root) {
                // Level 1
                console.log('\n\x1b[34mSUITE : %s\x1b[0m\n\x1b[34m---------------------------------------------------------------------------------\x1b[0m', suite.title);
            } else {
                if (suite.parent.parent.root) {
                    // Level 2
                    console.log('\n\x1b[34m  %s\x1b[0m', suite.title);
                } else {
                    // Level n
                    console.log('\n    %s', suite.title);
                }
            }
        }
    });

    runner.on('pass', function (test) {
        passes.push(test);
        totalPasses++;

        if (reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[32m    PASS: %s\x1b[0m", test.title);
        }
    });

    runner.on('fail', function (test, err) {
        failures.push(test);
        totalFailures++;

        if (reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[31m    FAIL: %s\x1b[0m -- error: %s", test.title, err.message);
        }
    });

    runner.on('pending', function (test) {
        pending.push(test);

        if (reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[34m    PENDING: %s\x1b[0m", test.title);
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

function checkResultsDir(outputFile) {

    var pathArray = outputFile.split("/");

    var elements = pathArray.length;

    if (elements > 1) {

        var dir = '/';
        var index = 0;

        // Get the DIR part of the path
        while (index < elements - 1) {

            if (pathArray[index].trim() !== '') {
                dir = dir + pathArray[index] + '/';
            }

            index++;
        }

        if (!_fs2.default.existsSync(dir)) {

            try {
                _fs2.default.mkdirSync(dir);
                console.log("Created directory for test files: %s", dir);
                return true;
            } catch (e) {
                console.log("Unable to create directory: %s. ERROR: %s", dir, e);
                return false;
            }
        } else {
            return false;
        }
    } else {
        return true;
    }
}
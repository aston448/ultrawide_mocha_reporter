
import mocha from 'mocha';
import fs from 'fs';

module.exports = UltrawideMochaReporter;

function setDefaultOrSpecifiedOptions(options) {

    // Options can be entered as env vars if not possible to supply as an options object

    //console.log("Options %o", options);

    if(options && options.reporterOptions && options.reporterOptions.resultsFile){


        let reporterOptions = options.reporterOptions;
        reporterOptions.resultsFile = reporterOptions.resultsFile || 'test-results.json';
        reporterOptions.consoleOutput = reporterOptions.consoleOutput || 'RESULT';

        return reporterOptions;

    } else {

        const userOutputFile = process.env.OUTPUT_FILE;
        const userConsoleOption = process.env.CONSOLE;

        // Default values
        let outputFile = '.test_results/test_results.json';
        let consoleOption = 'RESULT';

        if (typeof(userOutputFile) !== 'undefined') {
            outputFile = userOutputFile;
        }

        if (typeof(userConsoleOption) !== 'undefined') {
            consoleOption = userConsoleOption.toUpperCase();
        }

        let reporterOptions = {};
        reporterOptions.resultsFile = process.env.PWD + '/' + outputFile;
        reporterOptions.consoleOutput = consoleOption;

        return reporterOptions;
    }

}


function UltrawideMochaReporter(runner, userOptions){

    //console.log('Runner %o ', runner.suite.suites[0]);

    //runner.suite.bail(false);

    // Make sure that no suites bail out on errors
    runner.suite.suites.forEach((suite) => {
        suite.bail(false);
    });

    mocha.reporters.Base.call(this, runner);

    let self = this;
    let tests = [];
    let pending = [];
    let failures = [];
    let passes = [];
    let totalPasses = 0;
    let totalFailures = 0;

    const reporterOptions = setDefaultOrSpecifiedOptions(userOptions);

    runner.on('suite', function (suite) {
        //suite.bail(false);

        //console.log('Suite bail: ' + suite._bail);

        if(reporterOptions.consoleOutput === 'ON' && suite.title !== '') {
            console.log('\nTEST SUITE: %s\n---------------------------------------------------------------------------------', suite.title);
        }
    });

    runner.on('pass', function(test){
        passes.push(test);
        totalPasses++;

        if(reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[32m  PASS: %s\x1b[0m", test.title);
        }

    });

    runner.on('fail', function(test, err){
        failures.push(test);
        totalFailures++;

        if(reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[31m  FAIL: %s\x1b[0m -- error: %s", test.title, err.message);
        }
    });

    runner.on('pending', function (test) {
        pending.push(test);

        if(reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[34m  PENDING: %s\x1b[0m", test.title);
        }
    });

    runner.on('test end', (test) => {
        tests.push(test);
    });

    runner.on('end', function(){

        let obj = {
            stats: self.stats,
            pending: pending.map(createTestObject),
            passes: passes.map(createTestObject),
            failures: failures.map(createTestObject)
        };

        runner.testResults = obj;

        // Convert to JSON
        let jsonData = {};

        try {
            jsonData = JSON.stringify(obj, null, 2);
        } catch(e){
            console.log('\x1b[31mFailed to parse tests into JSON.\x1b[0m  Error: %s', e.message);
            process.exit(1);
        }

        // Write to default or specified file
        try {
            fs.writeFileSync(reporterOptions.resultsFile, jsonData);
            console.log('\nResults written to %s', reporterOptions.resultsFile);
        } catch(e){
            console.log('\n\x1b[31mFailed to write test output to %s.\x1b[0m  \nError: %s', reporterOptions.resultsFile, e.message);
        }

        // Log the output file and final results unless absolutely no logging
        if(reporterOptions.consoleOutput !== 'OFF') {
            console.log('\nTest run complete.');

            console.log('\n\x1b[34mFINAL SCORE: Passing: %d    Failing: %d\x1b[0m', totalPasses, totalFailures);
        }

        process.exit(0);
    });

}


function createTestObject (test) {
    return {
        title: test.title,
        fullTitle: test.fullTitle(),
        duration: test.duration,
        currentRetry: test.currentRetry(),
        err: errorJSON(test.err || {})
    };
}


function errorJSON (err) {
    let res = {};

    Object.getOwnPropertyNames(err).forEach(function (key) {
        res[key] = err[key];
    }, err);

    return res;
}

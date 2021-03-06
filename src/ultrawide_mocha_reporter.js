// export const reset = "\x1b[0m"
// export const bright = "\x1b[1m"
// export const dim = "\x1b[2m"
// export const underscore = "\x1b[4m"
// export const blink = "\x1b[5m"
// export const reverse = "\x1b[7m"
// export const hidden = "\x1b[8m"
//
// export const black = "\x1b[30m"
// export const red = "\x1b[31m"
// export const green = "\x1b[32m"
// export const yellow = "\x1b[33m"
// export const blue = "\x1b[34m"
// export const magenta = "\x1b[35m"
// export const cyan = "\x1b[36m"
// export const white = "\x1b[37m"
//
// export const BGblack = "\x1b[40m"
// export const BGred = "\x1b[41m"
// export const BGgreen = "\x1b[42m"
// export const BGyellow = "\x1b[43m"
// export const BGblue = "\x1b[44m"
// export const BGmagenta = "\x1b[45m"
// export const BGcyan = "\x1b[46m"
// export const BGwhite = "\x1b[47m"


import mocha from 'mocha';
import fs from 'fs';

module.exports = UltrawideMochaReporter;

function setDefaultOrSpecifiedOptions(options) {

    // Options can be entered as env vars or an options object depending on how the tests are run

    // See if env vars are being used
    const userOutputFile = process.env.OUTPUT_FILE;

    if (typeof(userOutputFile) !== 'undefined') {

        // Assume env var usage

        // Default values
        let outputFile = 'test_results.json';
        let consoleOption = 'RESULT';

        if(userOutputFile.length > 0) {
            outputFile = userOutputFile;
        }

        const userConsoleOption = process.env.CONSOLE;

        if (typeof(userConsoleOption) !== 'undefined') {
            consoleOption = userConsoleOption.toUpperCase();
        }

        let reporterOptions = {};

        if(outputFile.startsWith('/')){
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

        let reporterOptions = options.reporterOptions || {};
        reporterOptions.resultsFile = reporterOptions.resultsFile || 'test-results.json';

        if(reporterOptions.resultsFile.startsWith('/')){
            reporterOptions.resultsFile = process.env.PWD + reporterOptions.resultsFile;
        } else {
            reporterOptions.resultsFile = process.env.PWD + '/' + reporterOptions.resultsFile;
        }

        reporterOptions.consoleOutput = reporterOptions.consoleOutput || 'RESULT';

        checkResultsDir(reporterOptions.resultsFile);

        return reporterOptions;

    }

}


function UltrawideMochaReporter(runner, userOptions){


    // Make sure that no suites bail out on errors.
    // Ultrawide always wants to know about all test results

    // Goes down 3 levels of suites - all must be set or tests at that level don't run after a failure
    runner.suite.suites.forEach((suite) => {
        //console.log('\nSetting %s to bail false', suite.title);
        suite.bail(false);
        suite.suites.forEach((suite) => {
            //console.log('\nSetting %s to bail false', suite.title);
            suite.bail(false);
            suite.suites.forEach((suite) => {
                //console.log('\nSetting %s to bail false', suite.title);
                suite.bail(false);
            });
        });
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

        // Categorise the output depending on the hierarchical level in the test file
        if(reporterOptions.consoleOutput === 'ON' && suite.title !== '') {
            if(suite.parent.root){
                // Level 1
                console.log('\n\x1b[34mSUITE : %s\x1b[0m\n\x1b[34m---------------------------------------------------------------------------------\x1b[0m', suite.title);
            } else {
                if(suite.parent.parent.root){
                    // Level 2
                    console.log('\n\x1b[34m  %s\x1b[0m', suite.title);
                } else {
                    // Level n
                    console.log('\n    %s', suite.title);
                }
            }
        }
    });

    runner.on('pass', function(test){
        passes.push(test);
        totalPasses++;

        if(reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[32m    PASS: %s\x1b[0m", test.title);
        }

    });

    runner.on('fail', function(test, err){
        failures.push(test);
        totalFailures++;

        if(reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[31m    FAIL: %s\x1b[0m -- error: %s", test.title, err.message);
        }
    });

    runner.on('pending', function (test) {
        pending.push(test);

        if(reporterOptions.consoleOutput === 'ON') {
            console.log("\x1b[2m\x1b[33m    PENDING: %s\x1b[0m", test.title);
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
        } catch (e) {
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

function checkResultsDir (outputFile) {

    let pathArray = outputFile.split("/");

    let elements = pathArray.length;

    if (elements > 1){

        let dir = '/';
        let index = 0;

        // Get the DIR part of the path
        while(index < elements-1){

            if(pathArray[index].trim() !== '') {
                dir = dir + pathArray[index] + '/';
            }

            index++;
        }

        if (!fs.existsSync(dir)){

            try {
                fs.mkdirSync(dir);
                console.log("Created directory for test files: %s", dir);
                return true
            } catch(e){
                console.log("Unable to create directory: %s. ERROR: %s", dir, e);
                return false
            }

        } else {
            return false
        }

    } else {
        return true
    }
}

# Ultrawide Mocha Reporter #

A custom reporter for Ultrawide.  Outputs mocha test results as an Ultrawide compatible JSON file and optionally also to the console.

## Use ##

You are developing an application and mocha for testing and Ultrawide for your development control.

This reporter will output your test results in a JSON format that Ultrawide can read to a file that you can specify.

## Install ##

```npm install ultrawide-mocha-reporter --save-dev```

## Set Up ##

Set up depends on the context in which you are running mocha.

### Config file ###
If you can supply a reporter and reporter options, e.g. in a Chimp config file then setup could be something like this:

Chimp config file:

```
File: chimp.js

module.exports = {
    mocha: true,
    mochaConfig:
    {
        reporter: 'ultrawide-mocha-reporter',
        reporterOptions:
        {
            resultsFile: '<path/to/output_file>',
            consoleOutput: 'ON'
        }
    }
}
```
The JSON output file will appear under the directory in which you are running the test instance of your application.
The directory must exist before running the tests.

The consoleOutput options are:

 * ON - test results also appear on the console where you run the test command
 * RESULT - only the number of passes and fails is reported at the end of the run
 * OFF - no console output except errors

In your package.json file (or wherever you run chimp from) you would have something like this:

```
"scripts": {
    "chimp:acceptance": "chimp .config/chimp.js --ddp=http://localhost:3030 --path=tests/integration",
}
```
The above is for a meteor application where the config file is in a directory called .config.  See Chimp documentation for further details on using a config file

If you want to run different tests with different output files you would need to create more then one config file, e.g. chimp_1.js, chimp_2.js

### Environment Vars in command line ###

This is an example for Meteor testing.  But it should work wherever you can specify a mocha reporter.

In your package.json scripts, modify the script that runs your mocha tests to include the following environment variables (without the line breaks):

```
    "test:unit": "SERVER_TEST_REPORTER=ultrawide-meteor-mocha-reporter
     OUTPUT_FILE=.test_results/unit_results.json CONSOLE=ON
     meteor test --once  --driver-package dispatch:mocha",
```
The JSON output file will appear under the directory in which you are running the test instance of your application.
Any directory specified (e.g. ```.test_results/``` here) must exist before running the tests.

The CONSOLE options are:

 * ON - test results also appear on the console where you run the test command
 * RESULT - only the number of passes and fails is reported at the end of the run
 * OFF - no console output except errors


If you want to run different tests with different output files you would need to create more than one script.


## Licence ##
MIT



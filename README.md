# Ultrawide Mocha Reporter #

A custom reporter for Ultrawide to be used when running chimp mocha acceptance tests.

## Use ##

You are developing an application and using Chimp mocha for acceptance testing and Ultrawide for your development control.

This reporter will output your Chimp Mocha test results in a JSON format that Ultrawide can read to a file that you can specify.

## Install ##

```npm install ultrawide-mocha-reporter --save-dev```

## Set Up ##

You need to use a chimp config file containing the following:

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

## Licence ##
MIT



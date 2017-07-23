# Ultrawide Mocha Reporter #

A custom reporter for Ultrawide.  Outputs mocha test results as an Ultrawide compatible JSON file and, optionally, also to the console.

## Use Case ##

You are developing an application using Mocha for testing and Ultrawide for your development control.

This reporter will output your mocha test results in a JSON format that Ultrawide can read to a file that you can specify.

## Install ##

```npm install ultrawide-mocha-reporter --save-dev```

## Set Up ##

Set up depends on the context in which you are running mocha.  You can either specify mocha configuration or, if this is not possible, use environment variables

### Configuration Options ###
If you can supply config options to your mocha tests then the following should be specified:

```
mochaConfig:
{
    reporter: 'ultrawide-mocha-reporter',
    reporterOptions:
    {
        resultsFile: '<path/to/output_file>',
        consoleOutput: 'ON'
    }
}

```



### Environment Vars in command line ###

If you cannot reference mocha reporter options you can make this reporter work with environment variables in the command line provided that your method of working allows you to specify a custom reporter.

The following is an example for Meteor testing.  But it should work wherever you can specify a mocha reporter.  Once you specify the environment var OUTPUT_FILE the reporter will assume that you are driving it using environment variables, even if you did not have to specify ultrawide-mocha-reporter with one.

In your package.json scripts, modify the script that runs your mocha tests to include the following environment variables (without the line breaks):

```
    "test:unit": "SERVER_TEST_REPORTER=ultrawide-mocha-reporter
     OUTPUT_FILE=.test_results/unit_results.json CONSOLE=ON
     meteor test --once  --driver-package dispatch:mocha",
```

## Reporter Options ##

### Results File ###

The JSON output file will appear in your specified file under the directory in which you are running the test instance of your application.
Any sub-directory you specify must exist before running the tests.  Don't use a leading /.

### Console Output ###

The CONSOLE options are:

 * ON - test results also appear on the console where you run the test command.  NOTE: for some test runners this can cause  a problem if you have a LOT of tests and you run out of buffer space.  If this happens, use RESULT or OFF and use the file (and Ultrawide!) to check the test results.
 * RESULT - only the number of passes and fails is reported at the end of the run
 * OFF - no console output except errors



## Licence ##
MIT



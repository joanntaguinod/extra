/**
 * IMPORTANT: 
 *  Script is using `fs-extra` package to copy file
 * 
 * What it does:
 *  Changes the base href value in index.html after building/running:
 *      $ ng build --prod --env=sit
 * 
 * How to use:
 *  Place inside project folder root. Do NOT commit. 
 *  Run this nodejs script after building:
 *      $ node afterBuild.js <...arguments> 
 *  Sample:
 *      $ node afterBuild.js 20140 true true
 * 
 * Parameters (in order):
 *  baseHref - (string, required) Base href new value. Do not include slashes, no need for quotes.
 *  deleteNoto - (boolean, optional) Deletes Noto font folder for smaller build.
 *  zipDist - (boolean, optional) Makes a copy of the /dist folder, 
 *              renames it to `baseHref` value then zips it
 */

// IMPORTANT:


//PROPS
const distFileName = './dist/index.html';
const distPath = './dist/';
const notoFilePath = './dist/assets/fonts/noto';

let validBaseRef = "";
let deleteNoto = false;
let zipDist = false;

let dontCopy = false;    //if fs-extra is not installed

//IMPORTS
var readline = require('readline');
var rimraf = require('rimraf');

var fs;   //CATCH UNINSTALLED PACKAGES
try {
    isFsExtraInstalled = require.resolve("fs-extra");
    if (!fs) {
        fs = require('fs');
        dontCopy = true;
    }
    fs = require('fs-extra');

} catch (e) {
    console.error("`fs-extra` is not found. Using `fs` instead.\nZipping build is not allowed.");
    fs = require('fs');
}

//GET COMMAND LINE INPUT
//Arguments[]: node, filename, baseHref, deleteNoto?, zipDist?
const argsLength = process.argv.length;
if (argsLength >= 3) {
    deleteNoto = !!process.argv[3] ? !!process.argv[3] : false;
    zipDist = !!process.argv[4] ? !!process.argv[4] : false;

    if (checkBaseHrefValue(process.argv[2])) {
        readFile(validBaseRef);
    }
}
else if (argsLength > 3) {
    console.log("Please enter ONE argument only");
    rl.prompt();
}
else {
    rl.prompt();
}


//PROMPT IF NO INPUT
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('Enter baseref name (no slashes): ');
rl.on('line', function (input) {
    if (checkBaseHrefValue(input)) {
        readFile(validBaseRef);
    }
    rl.prompt();
}).on('close', function () {
    process.exit(0);
});


function checkBaseHrefValue(input) {
    console.log("Input:", input);
    let stripRegex = /[\/ ]/g;
    input = input.trim().replace(stripRegex, '');
    validBaseRef = input;
    let isValid = !!input ? true : false;

    if (isValid) {
        console.log("Cleaned input:", input);
        console.log("Updating index.html file...");
    }
    else {
        outputError("Invalid input: " + input);
    }

    return isValid;
}

function readFile(baseHref) {

    fs.stat(distFileName, function (error, stats) {
        fs.open(distFileName, "r", function (error, fd) {
            var buffer = new Buffer(stats.size);
            fs.read(fd, buffer, 0, buffer.length, null, (err, bytesRead, buffer) => {

                    if (err) {
                        return function () {
                            console.log(err);
                            rl.close();
                        };
                    }

                    let data = buffer.toString("utf8");
                    console.log(data);

                    if (!data) {
                        outputError("Empty index.html file!");
                    }

                    // let emptyBaseHrefRegex = /\<base href=\"\/\"\>/g;
                    let baseHrefRegex = /\<base href=\"[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*\"\>/g;
                    let newBaseHref = "<base href=\"/" + baseHref + "/\">";

                    if (!baseHrefRegex.test(data)) {
                        outputError("Cannot find empty base href.");
                        return;
                    };

                    const updatedData = data.replace(baseHrefRegex, newBaseHref);

                    fs.writeFile(distFileName, updatedData, 'utf8', function (err) {    //TODO: Update this. Make use of `.then()`
                        if (err) return outputError(err);

                        //OPTIONAL
                        if (deleteNoto) {
                            rimraf(notoFilePath, function (err) {
                                if (err) return outputError(err);

                                console.log('Deleted Noto folder.');

                                if (zipDist) {
                                    fs.copy(distPath, './' + validBaseRef, err => {
                                        if (err) return outputError(err);

                                        console.log('Finished building. Ready to deploy! =)) ');
                                        rl.close();
                                    });
                                }
                            });
                        }
                    });
                });
        });
    });

}

function outputError(message) {
    console.log(message);
    console.log("Aborting update process...");
    rl.close();
}
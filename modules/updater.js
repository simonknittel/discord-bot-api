import request from 'request';
import fs from 'fs';
import AdmZip from 'adm-zip';
import chalk from 'chalk';
import childProcess from 'child_process';
import rimraf from 'rimraf';

function removeUpdaterZIP(callback) {
    try {
        fs.unlinkSync('./updater.zip');
    } catch (e) {}

    callback();
}

function removeUpdaterDir(callback) {
    rimraf('./updater', () => {
        callback();
    });
}

function removeUpdater(callback) {
    let updaterDeleted = 0;

    function runCallback() {
        if (updaterDeleted === 2) {
            callback();
        }
    }

    removeUpdaterZIP(() => {
        updaterDeleted++;
        runCallback();
    });
    removeUpdaterDir(() => {
        updaterDeleted++;
        runCallback();
    });
}

function downloadUpdater(callback) {
    console.log('Downloading updater ...');

    request({
        url: 'https://github.com/simonknittel/discord-bot-api-updater/archive/master.zip',
        headers: {
            'User-Agent': 'simonknittel', // Needed otherwise the GitHub API will reject the request
        },
    })
    .pipe(fs.createWriteStream('updater.zip'))
    .on('close', () => {
        console.log(chalk.green('Done.'));
        console.log(''); // Empty line
        callback();
    });
}

function unzipUpdater(callback) {
    let zip = new AdmZip('./updater.zip');
    zip.extractAllTo('./updater/', true);
    callback();
}

function installUpdaterDependencies(callback) {
    console.log('Installing updater dependencies ...');

    childProcess.exec('cd updater/discord-bot-api-updater-master && npm install', error => {
        if (error) {
            console.log(chalk.red(error));
            console.log(''); // Empty line
            process.exit();
        }

        console.log(chalk.green('Done.'));
        console.log(''); // Empty line
        callback();
    });
}

function runUpdater() {
    console.log(chalk.yellow('Starting updater ...'));
    console.log(''); // Empty line

    childProcess.exec('cd updater/discord-bot-api-updater-master && npm start');

    // process.exit();
}

let updater = {
    start: () => {
        console.log(chalk.yellow('Starting update ...'));
        console.log(''); // Empty line

        removeUpdater(() => {
            downloadUpdater(() => {
                unzipUpdater(() => {
                    removeUpdaterZIP(() => {
                        installUpdaterDependencies(() => {
                            runUpdater();
                        });
                    });
                });
            });
        });
    },
    removeUpdater,
};

export default updater;

import request from 'request';
import fs from 'fs';
import AdmZip from 'adm-zip';
import chalk from 'chalk';
import child_process from 'child_process';
import rimraf from 'rimraf';
import os from 'os';
import semver from 'semver';
import packageJSON from '../package';

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

    child_process.exec('cd updater/discord-bot-api-updater-master && npm install', error => {
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

    const child = child_process.spawn(os.platform() === 'win32' ? 'npm.cmd' : 'npm', [
        'start',
    ], {
        cwd: './updater/discord-bot-api-updater-master',
        detached: true,
    });
    child.unref();

    process.exit();
}

let updater = {
    start: (callback) => {
        request({
            url: 'https://api.github.com/repos/simonknittel/discord-bot-api/releases/latest',
            json: true,
            headers: {
                'User-Agent': 'simonknittel', // Needed otherwise the GitHub API will reject the request
            },
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const currentVersion = packageJSON.version;
                const latestVersion = body.tag_name.substring(1);

                // Compares the latest release with local one
                if (semver.lt(currentVersion, latestVersion)) {
                    console.log(chalk.yellow('Starting update ...'));
                    console.log(''); // Empty line
                    callback();

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
                } else {
                    callback('already on latest release');
                }
            } else {
                console.error('error:', error);
                console.error('response.statusCode:', response.statusCode);
                console.error('body:', body);
                console.log(''); // Empty line

                callback('github api down');
            }
        });
    },
    removeUpdater,
};

export default updater;

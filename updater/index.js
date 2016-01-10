import request from 'request';
import fs from 'fs';
import AdmZip from 'adm-zip';
import mkdirp from 'mkdirp';
import chalk from 'chalk';

let currentRelease = 'v' + require('../package.json').version;
let targetedRelease = '';

function removeLatestZIP(callback) {
    try {
        fs.unlinkSync('./latest.zip');
    } catch (e) {}

    callback();
}

function removeLatestDir(callback) {
    callback();
}

function removeLatest(callback) {
    let latestDeleted = 0;

    function runCallback() {
        if (latestDeleted === 2) {
            callback();
        }
    }

    removeLatestZIP(() => {
        latestDeleted++;
        runCallback();
    });
    removeLatestDir(() => {
        latestDeleted++;
        runCallback();
    });
}

function downloadLatest(callback) {
    // console.log(chalk.blue('Downloading latest release ...'));
    console.log('Downloading latest release ...');

    request({
        url: 'https://api.github.com/repos/simonknittel/discord-bot-api/releases/latest',
        json: true,
        headers: {
            'User-Agent': 'simonknittel', // Needed otherwise the GitHub API will reject the request
        },
    }, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            console.error('error:', error);
            console.error('response.statusCode:', response.statusCode);
            console.error('body:', body);
            console.log(''); // Empty line
            process.exit();
        }

        targetedRelease = body.tag_name;

        const download = body.zipball_url;
        request({
            url: download,
            headers: {
                'User-Agent': 'simonknittel', // Needed otherwise the GitHub API will reject the request
            },
        })
        .pipe(fs.createWriteStream('latest.zip'))
        .on('close', () => {
            console.log(chalk.green('Done.'));
            console.log(''); // Empty line
            callback();
        });
    });
}

function unzipLatest(callback) {
    let zip = new AdmZip('./latest.zip');
    zip.extractAllTo('./latest/', true);
    callback();
}

// http://stackoverflow.com/a/14387791/3942401
function copyFile(source, target, cb) {
    var cbCalled = false;

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }

    var rd = fs.createReadStream(source);
    rd.on('error', err => {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on('error', err => {
        done(err);
    });
    wr.on('close', () => {
        done();
    });
    rd.pipe(wr);
}

function backupConfigJSON(callback) {
    // console.log(chalk.styles.blue.open + 'Backing up your ' + chalk.styles.blue.close + 'config.json' + chalk.styles.blue.open + ' ...' + chalk.styles.blue.close);
    console.log('Backing up your config.json ...');

    mkdirp('./backups', error => {
        if (error) {
            console.log(chalk.red(error));
            console.log(''); // Empty line
            process.exit();
        }

        copyFile('../config.json', './backups/config-' + currentRelease + '-' + targetedRelease + '.json', error => {
            if (error) {
                console.log(chalk.red(error));
                console.log(''); // Empty line
                process.exit();
            }

            console.log(chalk.green('Done.'));
            console.log(''); // Empty line
            callback();
        });
    });
}

console.log(chalk.styles.blue.open + 'Need help? Join our Discord server: ' + chalk.styles.blue.close + 'https://discord.gg/0jV29zKlvdJbDx3f');
console.log(''); // Empty line

removeLatest(() => {
    downloadLatest(() => {
        unzipLatest(() => {
            removeLatestZIP(() => {
                backupConfigJSON(() => {

                });
            });
        });
    });
});

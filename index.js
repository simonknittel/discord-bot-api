// Plugins
import './_plugins/music-bot';

import request from 'request';
import packageJSON from './package';
import cmp from 'semver-compare';
import chalk from 'chalk';

// Checks the GitHub releases for the latest version and notifies the owner if a new release is available
function checkForUpdates() {
    request({
        url: 'https://api.github.com/repos/simonknittel/discord-bot-api/releases/latest',
        json: true,
        headers: {
            'User-Agent': 'simonknittel',
        },
    }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const currentVersion = packageJSON.version;
            const latestVersion = body.tag_name.substring(1);

            if (cmp(currentVersion, latestVersion) === -1) {
                console.log(chalk.red('There is a new version available for the bot. Visit https://github.com/simonknittel/discord-bot-api to download the latest version.'));
                console.log(''); // Empty line
                console.log(chalk.yellow('Your version:', currentVersion));
                console.log('Latest version:', latestVersion);
                console.log(''); // Empty line
            }
        } else {
            console.error('error:', error);
            console.error('response.statusCode:', response.statusCode);
            console.error('body:', body);
            console.log(''); // Empty line
        }
    });
}

checkForUpdates();
setInterval(checkForUpdates, 3600000);

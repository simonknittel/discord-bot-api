// Discord Bot API
import events from './modules/events';

// Other
import request from 'request';
import packageJSON from '../package';
import cmp from 'semver-compare'; // Compare semver versions
import chalk from 'chalk'; // Coloring console logs

console.log(chalk.blue('Need help? Join our Discord server:') + ' https://discord.gg/0jV29zKlvdJbDx3f');
console.log(''); // Empty line

import './modules/plugins';

const newVersions = [];

/**
 * Checks the GitHub releases for the latest version and notifies the owner if a new release is available
 * @method checkForUpdates
 * @return {Void}          Returns nothing
 */
function checkForUpdates() {
    // Request the GitHub API
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

            return false;
        }

        const currentVersion = packageJSON.version;
        const latestVersion = body.tag_name.substring(1);

        // Compares the latest release with local one
        if (cmp(currentVersion, latestVersion) === -1) {
            if (newVersions.indexOf(latestVersion) < 0) {
                newVersions.push(latestVersion);

                console.log(chalk.red('There is a new version available for the bot.'));
                console.log('Visit https://github.com/simonknittel/discord-bot-api to download the latest version.');
                console.log('Check out the CHANGELOG.md file for important changes.');
                console.log(''); // Empty line
                console.log(chalk.yellow('Your version:', currentVersion));
                console.log('Latest version:', latestVersion);
                console.log(''); // Empty line

                events.emit('update', {
                    currentVersion,
                    latestVersion,
                });
            }
        }
    });
}

checkForUpdates();
setInterval(checkForUpdates, 3600000); // Check for updates all 60 minutes

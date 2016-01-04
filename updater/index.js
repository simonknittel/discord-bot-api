import request from 'request';
import fs from 'fs';

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

    const download = body.zipball_url;
    request(download)
        .pipe(fs.createWriteStream('latest.zip'))
        .on('close', () => {
            console.log('File written!');
        });
});

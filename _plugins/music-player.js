import bot from '../_modules/bot';

let playlist = [];

function add() {
    console.log('... added to the playlist added.');
}

function remove() {
    console.log('... removed from the playlist.');
}

function skip() {}

function play() {}

function stop() {}

function current() {}

function showPlaylist() {
    console.log('Current playlist: ' + playlist.join(', '));
}

export {skip, play, stop, add, remove, current, showPlaylist};

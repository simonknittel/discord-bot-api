import bot from '../_modules/bot';

let participants = [];

function create() {
    console.log('Raffle created.');
}

function start() {
    console.log('Raffle started. Enter !join to join the raffle.');
}

function join() {
    console.log('... joined the raffle.');
}

function leave() {
    console.log('... left the raffle.');
}

function list() {
    console.log('Current participants of the raffle: ' + participants.join(', '));
}

function draw() {
    console.log('The winner of the raffle is ...');
}

export {create, start, join, leave, list, draw};

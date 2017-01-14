// Discord Bot API
import configModule from './config';
import bot from './bot';

/**
 * Checks if the user has the requested permission
 * @method isOperator
 * @param  {Integer} userID              [description]
 * @param  {String}  requestedPermission [description]
 * @param  {Integer} channelID           [description]
 * @return {Boolean}                     [description]
 */
function isOperator(userID, requestedPermission, channelID) {
    // The owner has every permission
    if (userID === configModule.get().ownerID) return true;

    if (
        configModule.get().operators
        && configModule.get().operators[userID]
        && configModule.get().operators[userID].permissions
    ) {
        for (const permission of configModule.get().operators[userID].permissions) {
            if (
                permission === requestedPermission
                || permission === '*'
                || (permission.split(':')[0] === requestedPermission.split(':')[0] && permission.split(':')[1] === '*')
            ) {
                return true;
            }
        }
    }

    bot.sendMessage({
        to: channelID,
        message: 'You do not have the permission to run this command.',
    });

    // The user does not have the permission
    return false;
}

let api = {
    isOperator,
};

export default api;

// Discord Bot API
import configModule from './config';
import bot from './bot';

// Check if the user has the requested permission
function isOperator(userID, requestedPermission, channelID) {
    // The owner has every permission
    if (userID === configModule.get().ownerID) {
        return true;
    }

    if (
        configModule.get().operators
        && configModule.get().operators[userID]
    ) {
        for (const permission of configModule.get().operators[userID].permissions) {
            return permission === requestedPermission;
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

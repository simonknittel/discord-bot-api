// Discord Bot API
import configModule from './config';
import bot from './bot';

// Check if the user has the requested permission
function isOperator(userID, requestedPermission) {
    // The owner has every permission
    if (userID === configModule.get().ownerID) {
        return true;
    }

    if (configModule.get().operators.length > 0) {
        for (const operator of configModule.get().operators) {
            if (operator.id === userID) {
                for (const permission of operator.permissions) {
                    return permission === requestedPermission;
                }
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

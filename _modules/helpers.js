// http://stackoverflow.com/a/171256/3942401
function mergeObjects(obj1, obj2) {
    let obj3 = {};

    for (const attr in obj1) { obj3[attr] = obj1[attr]; }
    for (const attr in obj2) { obj3[attr] = obj2[attr]; }

    return obj3;
}

export {mergeObjects};

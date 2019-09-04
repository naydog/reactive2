import {
    isObject
}
from './utils'

const OB_KEY = '_$ob$_';

function Observer() {
    // properties of the host that are referencing properties of other object
    this.referencing = {};
    // properties of the host that are referenced by other object
    this.referenced = {};
    // watches for properties of the host. The property must be original, not referencing other properties
    this.watches = {};
}



export function observe(obj, key) {
    if (!obj[OB_KEY]) {
        var ob = new Observer();
        Object.defineProperty(obj, OB_KEY, {
            enumerable: false,
            configurable: true,
            get: function () {
                return ob;
            }
        });
    }
    obj[OB_KEY].referenced[key] = [];
}

export function notify(obj, key, oldVal, newVal) {
    var watches = obj && obj[OB_KEY] && obj[OB_KEY].watches[key];
    for (var i in watches) {
        watches[i].fn(oldVal, newVal);
    }
}

export function isObserved(obj) {
    return isObject(obj) && obj[OB_KEY];
}

export function addWatch(obj, key, name, fn) {
    var rootObj = findRootRef(obj, key);
    // add watch to root obj
    var watches = rootObj.obj[OB_KEY].watches;
    watches[rootObj.key] = watches[rootObj.key] || [];
    var watchesOnKey = watches[rootObj.key];
    for (var i in watchesOnKey) {
        if (watchesOnKey[i].name == name) {
            console.warn(`There is already a watch named ${name}. Will override it`);
            watchesOnKey[i].fn = fn;
            return;
        }
    }

    // new watch
    watchesOnKey.push({
        name: name,
        fn: fn
    });
}

export function removeWatch(obj, key, name) {
    var rootObj = findRootRef(obj, key);
    // remove watch from root obj
    var watchesOnKey = rootObj.obj[OB_KEY].watches[rootObj.key];
    if (watchesOnKey) {
        if (typeof name !== 'undefined') {
            for (var i = watchesOnKey.length - 1; i > -1; i--) {
                if (watchesOnKey[i].name == name) {
                    watchesOnKey.splice(i, 1);
                    return;
                }
            }
        } else {
            watchesOnKey.splice(0, watchesOnKey.length);
        }
    }
}

function findRootRef(obj, key) {
    var refObjects = [{
        obj: obj,
        key: key
    }];
    var currObj = obj;
    var currKey = key;
    // find root ref
    var rootObj;
    while (rootObj = getReferencing(currObj, currKey)) {
        refObjects.unshift(rootObj);
        currObj = rootObj.obj;
        currKey = rootObj.key;
    }

    return refObjects[0];
}

/**
 * Return the referencing obj and property for the argumenrts
 * @param {object} obj 
 * @param {string} key 
 */
export function getReferencing(obj, key) {
    return obj[OB_KEY] && obj[OB_KEY].referencing[key];
}

export function setReferencing(successorObj, successorKey, predecessorObj, predecessorKey) {
    successorObj[OB_KEY].referencing[successorKey] = {
        obj: predecessorObj,
        key: predecessorKey
    };
}

export function setReferenced(successorObj, successorKey, predecessorObj, predecessorKey) {
    for (var i in predecessorObj[OB_KEY].referenced[predecessorKey]) {
        var ref = predecessorObj[OB_KEY].referenced[predecessorKey][i];
        if (ref.obj == successorObj && ref.key == successorKey) {
            return;
        }
    }
    predecessorObj[OB_KEY].referenced[predecessorKey].push({
        obj: successorObj,
        key: successorKey
    });
}

export function setReference(successorObj, successorKey, predecessorObj, predecessorKey) {
    setReferencing(successorObj, successorKey, predecessorObj, predecessorKey);
    setReferenced(successorObj, successorKey, predecessorObj, predecessorKey);
}
import {
    observe,
    notify,
    isObserved,
    addWatch,
    removeWatch,
    getReferencing,
    setReferencing,
    setReference,
} from './observer'


function defineReactiveProperty(obj, key, val) {

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function () {
            return val
        },
        set: function (newVal) {
            var oldVal = val;
            val = newVal;
            notify(obj, key, oldVal, newVal);
        }
    });

    observe(obj, key);
}

function set(obj, key, val) {
    var prop = Object.getOwnPropertyDescriptor(obj, key);
    if (prop && prop.set) {
        obj[key] = val;
    } else {
        defineReactiveProperty(obj, key, val);
    }
}


function watch(obj, key, name, fn) {
    addWatch(obj, key, name, fn);
}

function unwatch(obj, key, name) {
    removeWatch(obj, key, name);
}


function setByRef(targetObj, targetKey, sourceObj, sourceKey) {
    var property = Object.getOwnPropertyDescriptor(sourceObj, sourceKey);
    if (!property || typeof property.value !== 'undefined' || !isObserved(sourceObj)) {
        throw `Property "${sourceKey}" of source object is not reactive`;
    }

    // check circular reference
    var currObj = sourceObj;
    var currKey = sourceKey;
    var predecessor;
    while (predecessor = getReferencing(currObj, currKey)) {
        if (predecessor.obj == targetObj && predecessor.key == targetKey) {
            throw `Circular reference error`;
        }
        currObj = predecessor.obj;
        currKey = predecessor.key;
    }

    Object.defineProperty(targetObj, targetKey, property);

    observe(targetObj, targetKey);
    // save ref info in both source and target
    setReference(targetObj, targetKey, sourceObj, sourceKey);
}


export default {
    set,
    setByRef,
    watch,
    unwatch
}
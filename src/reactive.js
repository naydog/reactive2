import {
    attachObserver
} from './observer'


function defineReactiveProperty(obj, key, val) {

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function () {
            return val
        },
        set: function setter(newVal) {
            var oldVal = val;
            val = newVal;
            if (obj && obj._$ob$_ && obj._$ob$_.watches[key]) {
                var watches = obj._$ob$_.watches[key];
                for (var i = 0; i < watches; i++) {
                    watches[i].fn(oldVal, newVal);
                }
            }
        }
    });

    initObserver(obj, key);
}

function set(obj, key, val) {
    var prop = Object.getOwnPropertyDescriptor(obj, key);
    if (prop && prop.set) {
        obj[key] = val;
    } else {
        defineReactiveProperty(obj, key, val);
    }
}

function initObserver(obj, key) {
    if (!obj._$ob$_) {
        obj._$ob$_ = {
            from: {},
            to: {},
            watches: {}
        };
    }
    obj._$ob$_.to[key] = [];
}

function watch(obj, key, fn) {
    var refObjects = [{
        obj: obj,
        key: key
    }];
    var currObj = obj;
    var currKey = key;
    // find root ref
    while (currObj._$ob$_ && currObj._$ob$_.from[currKey]) {
        var fromInfo = currObj._$ob$_.from[currKey];
        refObjects.unshift(fromInfo);
        currObj = fromInfo.obj;
        currKey = fromInfo.key;
    }

    // add watch to root setter
    var prop = Object.getOwnPropertyDescriptor(currObj, currKey);
    var getter = prop.get;
    var setter = prop.set;
    prop.set = function (newVal) {
        var oldVal = getter.call(this);
        setter.call(this, newVal);
        fn(oldVal, newVal);
    }

    // update all setters of refs
    var idx = 0;
    while (idx < refObjects.length) {
        var refObj = refObjects[idx];
        Object.defineProperty(refObj.obj, refObj.key, prop);
        idx++;
        // add other branches
        if (refObj.obj._$ob$_.to && refObj.obj._$ob$_.to[refObj.key]) {
            var tos = refObj.obj._$ob$_.to[refObj.key];
            for (var i in tos) {
                var filterObjs = refObjects.filter(function (e) {
                    return e.obj == tos[i].obj && e.key == tos[i].key;
                });
                if (filterObjs.length == 0) {
                    refObjects.push(tos[i]);
                }
            }
        }
    }
}


function setByRef(targetObj, targetKey, sourceObj, sourceKey) {
    var property = Object.getOwnPropertyDescriptor(sourceObj, sourceKey);
    if (!property || typeof property.value !== 'undefined' || !sourceObj._$ob$_) {
        throw `Property "${sourceKey}" of source object is not reactive`;
    }

    // check circular reference
    var currObj = sourceObj;
    var currKey = sourceKey;
    while (currObj._$ob$_.from[currKey]) {
        var predecessor = currObj._$ob$_.from[currKey];
        if (predecessor.obj == targetObj && predecessor.key == targetKey) {
            throw `Circular reference error`;
        }
        currObj = predecessor.obj;
        currKey = predecessor.key;
    }

    Object.defineProperty(targetObj, targetKey, property);

    // save ref source info in target object
    initObserver(targetObj, targetKey);
    targetObj._$ob$_.from[targetKey] = {
        obj: sourceObj,
        key: sourceKey
    };

    // save being ref info in source object
    for (var i in sourceObj._$ob$_.to[sourceKey]) {
        var ref = sourceObj._$ob$_.to[sourceKey][i];
        if (ref.obj == targetObj && ref.key == targetKey) {
            return;
        }
    }
    sourceObj._$ob$_.to[sourceKey].push({
        obj: targetObj,
        key: targetKey
    });
}


export default {
    set,
    setByRef,
    watch,
}
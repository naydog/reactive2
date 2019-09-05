import {
    observe,
    notify,
    notifyParent,
    isObserved,
    addWatch,
    removeWatch,
    getReferencing,
    setReferencing,
    setReference,
} from './observer'
import {
    isObject,
    isArray,
} from './utils'

// intercept method that update a array
var arrayMethodNames = [
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse'
];
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);
arrayMethodNames.forEach(function (method) {
	// cache original method
	var original = arrayProto[method];
	Object.defineProperty(arrayMethods, method, {
		enumerable: false,
		writable: true,
		configurable: true,
		value: function () {
			var args = [],
				len = arguments.length;
			while (len--) args[len] = arguments[len];

			var oldVal = this.slice();
			var result = original.apply(this, args);
			var newItems;
			switch (method) {
				case 'push':
				case 'unshift':
					newItems = args;
					break
				case 'splice':
					newItems = args.slice(2);
					break
			}
			if (newItems) {
				for (var i in newItems) {
					toReactiveObject(newItems[i]);
				}
            }
            // notify change 
            notifyParent(this, oldVal, this);
			return result;
		}
	});
});

function overrideArrayMethod(array) {
	for (var i in arrayMethodNames) {
		var method = arrayMethodNames[i];
		Object.defineProperty(array, method, Object.getOwnPropertyDescriptor(arrayMethods, method));
	}
}


function defineReactiveProperty(obj, key, val) {
    var property = Object.getOwnPropertyDescriptor(obj, key);
	if (property && property.configurable === false) {
		return;
    }
    
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function () {
            return val;
        },
        set: function (newVal) {
            var value = val;
			if (newVal === value || (newVal !== newVal && value !== value)) {
				return;
            }

            togglePropertyEnumable(obj, key, true);
			if (isObject(newVal) && isObject(value) && isArray(newVal) == isArray(value)) { // Both are objects, and of same type
				if (isArray(newVal)) { //  Both are arrays
					for (var i = 0; i < value.length && i < newVal.length; i++) {
						toReactiveObject(newVal[i]);
						value[i] = newVal[i];
					}
					for (var i = value.length; i < newVal.length; i++) {
						toReactiveProperty(value, i, newVal[i]);
					}
					value.length = newVal.length;
				} else { // Both are normal objects
					// Remove properties
					for (var i in value) {
						if (!Object.getOwnPropertyDescriptor(newVal, i)) {
							// Set to undefined, not delete. For recover
							value[i] = undefined;
							togglePropertyEnumable(value, i, false);
						}
					}
					// Copy newVal properties to old value
					for (var i in newVal) {
						var property = Object.getOwnPropertyDescriptor(value, i);
						if (property) { // Update properties  
							value[i] = newVal[i];
						} else { // Add properties
							toReactiveProperty(value, i, newVal[i]);
						}
					}
				}
			} else { // Type change or primitive value change
                toReactiveObject(newVal);
				val = newVal;
            }
            
            notify(obj, key, value, newVal);
        }
    });

    observe(obj, key, val);
}

function togglePropertyEnumable(obj, key, enumerable) {
	var property = Object.getOwnPropertyDescriptor(obj, key);
	if (property.enumerable !== !!enumerable) {
		property.enumerable = !!enumerable;
		Object.defineProperty(obj, key, property);
	}
}

/**
 * Turn a json-like object to be reactive.
 * DO NOT turn an object including function as property to reactive.
 * @param {object} obj a json-like object
 */
function toReactiveObject(obj) {
    if (isObject(obj)) {
        if (isArray(obj)) {
            overrideArrayMethod(obj);
            for (var i in obj) {
                toReactiveObject(obj[i]);
            }
        } else {
            for (var i in obj) {
                toReactiveProperty(obj, i, obj[i]);
            }
        }
    }
}

function toReactiveProperty(obj, key, val) {
    defineReactiveProperty(obj, key, val);
	toReactiveObject(obj[key]);
}

function set(obj, key, val) {
    var prop = Object.getOwnPropertyDescriptor(obj, key);
    if (!prop || !prop.set) {
        toReactiveProperty(obj, key, val);
    } else {
        obj[key] = val;
    }
}


function watch(obj, key, name, fn) {
    if (typeof name === 'function') {
        addWatch(obj, key, undefined, name);
    } else {
        addWatch(obj, key, name, fn);
    }
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
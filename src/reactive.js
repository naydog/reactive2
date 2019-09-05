import ob from './observer'
import ut from './utils'
import cc from './consts'

// intercept method that update a array
var arrayMethodNames = [
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse'
]
var arrayProto = Array.prototype
var arrayMethods = Object.create(arrayProto)
arrayMethodNames.forEach(function (method) {
	// cache original method
	var original = arrayProto[method]
	Object.defineProperty(arrayMethods, method, {
		enumerable: false,
		writable: true,
		configurable: true,
		value: function () {
			var args = [],
				len = arguments.length
			while (len--) args[len] = arguments[len]

			var oldVal = this.slice()
			var result = original.apply(this, args)
			var newItems
			switch (method) {
				case 'push':
				case 'unshift':
					newItems = args
					break
				case 'splice':
					newItems = args.slice(2)
					break
			}
			if (newItems) {
				for (var i in newItems) {
					toReactiveObject(newItems[i])
				}
			}
			// notify change 
			ob.notifyParent(this, oldVal, this)
			return result
		}
	})
})

function overrideArrayMethod(array) {
	for (var i in arrayMethodNames) {
		var method = arrayMethodNames[i]
		Object.defineProperty(array, method, Object.getOwnPropertyDescriptor(arrayMethods, method))
	}
}


function defineReactiveProperty(obj, key, val) {
	var property = Object.getOwnPropertyDescriptor(obj, key)
	if (property && property.configurable === false) {
		return
	}

	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function () {
			return val
		},
		set: function (newVal) {
			var value = val
			if (newVal === value || (newVal !== newVal && value !== value)) {
				return
			}

			togglePropertyEnumable(obj, key, true)
			if (ut.isObject(newVal) && ut.isObject(value) && ut.isArray(newVal) == ut.isArray(value)) { // Both are objects, and of same type
				var oldValue = JSON.parse(JSON.stringify(value)) // copy old value for notify
				if (ut.isArray(newVal)) { //  Both are arrays
					for (var i = 0; i < value.length && i < newVal.length; i++) {
						toReactiveObject(newVal[i])
						value[i] = newVal[i]
					}
					for (var i = value.length; i < newVal.length; i++) {
						toReactiveProperty(value, i, newVal[i])
					}
					value.length = newVal.length
				} else { // Both are normal objects
					// Remove properties
					for (var i in value) {
						if (!Object.getOwnPropertyDescriptor(newVal, i)) {
							// Set to undefined, not delete. For recover
							value[i] = undefined
							togglePropertyEnumable(value, i, false)
						}
					}
					// Copy newVal properties to old value
					for (var i in newVal) {
						var property = Object.getOwnPropertyDescriptor(value, i)
						if (property) { // Update properties  
							value[i] = newVal[i]
						} else { // Add properties
							toReactiveProperty(value, i, newVal[i])
						}
					}
				}
				value = oldValue
			} else { // Type change or primitive value change
				toReactiveObject(newVal)
				val = newVal
			}

			ob.notify(obj, key, value, newVal)
		}
	})

	ob.observe(obj, key, val)
}

function togglePropertyEnumable(obj, key, enumerable) {
	var property = Object.getOwnPropertyDescriptor(obj, key)
	if (property.enumerable !== !!enumerable) {
		property.enumerable = !!enumerable
		Object.defineProperty(obj, key, property)
	}
}

/**
 * Turn a json-like object to be reactive.
 * DO NOT turn an object including function as property to reactive.
 * @param {object} obj a json-like object
 */
function toReactiveObject(obj) {
	if (ut.isObject(obj)) {
		if (ut.isArray(obj)) {
			overrideArrayMethod(obj)
			for (var i in obj) {
				toReactiveObject(obj[i])
			}
		} else {
			for (var i in obj) {
				toReactiveProperty(obj, i, obj[i])
			}
		}
	}
}

function toReactiveProperty(obj, key, val) {
	defineReactiveProperty(obj, key, val)
	toReactiveObject(obj[key])
}

function set(obj, key, valOrSetter) {
	// val is a function, then add val as watch
	if (typeof valOrSetter == 'function') {
		setValue(obj, key, null)
		watch(obj, key, cc.DEF_SETTER, valOrSetter)
	} else {
		setValue(obj, key, valOrSetter)
	}
}

function setValue(obj, key, val) {
	var prop = Object.getOwnPropertyDescriptor(obj, key)
	if (!prop || !prop.set) {
		toReactiveProperty(obj, key, val)
	} else {
		obj[key] = val
	}
}


function watch(obj, key, name, fn) {
	if (typeof name === 'function') {
		ob.addWatch(obj, key, cc.DEF_WATCH, name)
	} else {
		ob.addWatch(obj, key, name, fn)
	}
}

function unwatch(obj, key, name) {
	ob.removeWatch(obj, key, name)
}


function setByRef(targetObj, targetKey, sourceObj, sourceKey) {
	var property = Object.getOwnPropertyDescriptor(sourceObj, sourceKey)
	if (!property || typeof property.value !== 'undefined' || !ob.isObserved(sourceObj)) {
		throw `Property "${sourceKey}" of source object is not reactive`
	}

	// check circular reference
	var currObj = sourceObj
	var currKey = sourceKey
	var predecessor
	while (predecessor = ob.getReferencing(currObj, currKey)) {
		if (predecessor.obj == targetObj && predecessor.key == targetKey) {
			throw `Circular reference error`
		}
		currObj = predecessor.obj
		currKey = predecessor.key
	}

	Object.defineProperty(targetObj, targetKey, property)

	ob.observe(targetObj, targetKey)
	// save ref info in both source and target
	ob.setReference(targetObj, targetKey, sourceObj, sourceKey)
}


export default {
	set,
	setByRef,
	watch,
	unwatch
}
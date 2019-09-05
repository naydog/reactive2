function isObject(obj) {
	return typeof obj == 'object' && !!obj
}

function isArray(obj) {
	return Array.isArray(obj)
}

/* istanbul ignore next */
function isPrimitive(value) {
	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

const ut = {
	isObject,
	isArray,
	isPrimitive
}

export default ut
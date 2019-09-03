function Observer() {
    // properties of the host that are referencing properties of other object
    this.referencing = {};
    // properties of the host that are referenced by other object
    this.referenced = {};
    // watches for properties of the host. The property must be original, not referencing other properties
    this.watches = {};
}



const obKey = '_$ob$_';

function attachObserver(obj, key) {
    if (!obj[obKey]) {
        var ob = new Observer();
        Object.defineProperty(obj, obKey, {
            enumerable: false,
            configurable: true,
            writable: true,
            value: ob
        });
    }
    obj[obKey].referenced[key] = [];
}


export default {
    attachObserver
}
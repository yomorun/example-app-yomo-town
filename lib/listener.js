export default class Listener {
    constructor() {
        this._listener = {}
    }

    on(type, fn) {
        if (typeof type === 'string' && typeof fn === 'function') {
            if (typeof this._listener[type] === 'undefined') {
                this._listener[type] = [fn]
            } else {
                this._listener[type].push(fn)
            }
        }

        return this
    }

    emit(type, data) {
        if (type && this._listener[type]) {
            for (let i = 0, len = this._listener[type].length; i < len; i++) {
                this._listener[type][i].call(this, data)
            }
        }

        return this
    }

    remove(type, key) {
        const listeners = this._listener[type]

        if (listeners instanceof Array) {
            if (typeof key === 'function') {
                for (let i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === key) {
                        listeners.splice(i, 1)
                        break
                    }
                }
            } else if (key instanceof Array) {
                for (let i = 0, len = key.length; i < len; i++) {
                    this.remove(type, key[len])
                }
            } else {
                delete this._listener[type]
            }
        }

        return this
    }
}

var require, define;
(function (global, undefined) {

    var _uuid = 'require' + new Date().getTime();
    var _registry = {};

    var extend = function (obj, descriptors) {
        Object.keys(descriptors).forEach(function (key) {
            var descriptor = Object.getOwnPropertyDescriptor(descriptors, key);
            Object.defineProperty(obj, key, descriptor);
        });
    };

    require = function (dependencies, callback) {
        if (typeof dependencies === 'function') {
            callback = dependencies;
            dependencies = [];
        };

        var args = dependencies.map(function (dependency){
            return require.mapDependency(dependency);
        });

        try {
            return callback.apply(null, args);
        } catch (e) {
            require.onerror('error in require callback', e);
        }
    };

    define = function (name, dependencies, factory) {
        var exports = require(dependencies, factory);
        if (typeof exports === 'function') {
            require.set(_registry, name, exports);
        } else {
            require.extend(require.set(_registry, name), exports);
        }
    };

    extend(require, {
        mapDependency: function (dependency) {
            var exports = require.get(_registry, dependency);
            if (exports === undefined) {
                require.onerror('unknown dependency requested', dependency);
            };
            return exports;
        },
        onerror: function (message, args) {
            console.log(message, args);
        },
        get: function (obj, path) {
            if (typeof obj === 'string') {
                path = obj;
                obj = global;
            }

            var parts = path.split('.');
            while (obj && parts.length) {
                var part = parts.shift();
                obj = obj[part];
            }
            return obj;
        },
        set: function (obj, path, value) {
            if (typeof obj === 'string') {
                value = path;
                path = obj;
                obj = global;
            }

            var parts = path.split('.');
            while (parts.length) {
                var part = parts.shift();
                if (!parts.length && value !== undefined) {
                    obj[part] = value;
                } else {
                    obj = obj[part] || (obj[part] = {});
                }
            }
            return obj;
        },
        extend: extend,
        get uuid() {
            return _uuid;
        }
    });

}(this));

(function (global, r, undefined) {

    if (r === undefined) {
        return;
    }

    var _views = r.get('chrome.extension.getViews');
    if (_views === undefined) {
        // Shared functionality is only needed in Chrome Extension
        return;
    }

    var getShared = function () {
        var view = _views().filter(function (view) {
            var uuid;
            return view !== global
                && !!(uuid = r.get(view, 'require.uuid'))
                && uuid !== require.uuid;
        });
        return view.length ? r.get(view[0], 'require.shared') : {};
    };

    Object.defineProperty(r, 'shared', {
        value: getShared(),
        configurable: false,
        writable: false
    });

    r.defineGlobal = function (name, dependencies, factory) {
        var exports = r(dependencies, factory);
        if (typeof exports === 'function') {
            r.set(r.shared, name, exports);
        } else {
            r.extend(r.set(r.shared, name), exports);
        }
    };

    r.mapDependency = (function (original) {
        return function (dependency) {
            var exports = r.get(r.shared, dependency);
            if (exports !== undefined) {
                return exports;
            }
            return original(dependency);
        };
    }(r.mapDependency));

}(this, this.require));
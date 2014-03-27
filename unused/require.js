var require, define;
(function (global, undefined) {

    var _requireCounter = 0;
    var _head = document.getElementsByTagName('head')[0];

    var Module = function (moduleMap, required) {
        this.map = moduleMap;
        this.required = required;
        this.depCount = 0;
        this.args = [];
        this.argsMatched = [];
        this.events = {};
    };

    Module._requireCounter = 1;
    Module._registry = {};
    Module._defined = {};
    Module._defineQueue = [];

    Module.getRequire = function () {
        return '_@@' + (Module._requireCounter++);
    };

    Module.push = function (defined) {
        Module._defineQueue.push(defined);
    };

    Module.scriptLoaded = function (ev) {
        var node = ev.currentTarget;
        var name = node.getAttribute('data-module-name');
        Module.completeLoad(name);
    };

    Module.completeLoad = function (name) {
        var queue = Module._defineQueue;
        while (queue.length) {
            var defined = queue.shift();

            if (defined[0] === null) {
                defined[0] = name;
            } else if (defined[0] !== name) {
                break;
            }

            Module.getModule(defined[0]).init(defined[1], defined[2]);
        }

        Module.checkLoaded();
    };

    Module.getModule = function (name, required) {
        var map = Module.makeModuleMap(name);
        var module = Module._registry[map.id];
        if (!module) {
            console.log('creating module', map.id);
            module = new Module(map, required);
            Module._registry[map.id] = module;
        }
        return module;
    };

    Module.makeModuleMap = function (name) {
        var id = name;
        if (name[0] === '.') {
            var index = name.indexOf('/');
            id = name.substr(index);
        }

        return {
            id: id,
            name: name
        };
    };

    Module.checkLoaded = function () {
        for (var prop in Module._registry) {
            if (Module._registry.hasOwnProperty(prop)) {
                var module = Module._registry[prop];

                module.check();
            }
        }
    };

    Module.prototype.init = function (deps, factory) {
        this.deps = deps || [];
        this.factory = factory;

        this.load();
    };

    Module.prototype.fetch = function () {
        if (this.fetched) {
            return;
        }

        this.fetched = true;

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.addEventListener('load', Module.scriptLoaded, false);
        script.src = this.map.name + '.js';
        script.setAttribute('data-module-name', this.map.id);

        _head.appendChild(script);
    };

    Module.prototype.load = function () {
        var self = this;

        this.loading = true;
        this.deps.forEach(function (dependency, i) {
            self.depCount++;

            var depMap = Module.makeModuleMap(dependency);
            if (Module._defined.hasOwnProperty(depMap.id)) {
                self.defineArgument(i, Module._defined[depMap.id]);
            } else {
                var module = Module.getModule(dependency);
                module.on('defined', function (depExport) {
                    self.defineArgument(i, depExport);
                });
                module.fetch();
            }
        });
        this.loading = false;
        this.check();
    };

    Module.prototype.defineArgument = function (index, depExport) {
        if (this.argsMatched[index]) {
            return;
        }
        this.argsMatched[index] = true;
        this.args[index] = depExport;
        this.depCount--;
        this.check();
    };

    Module.prototype.check = function () {
        if (this.loading || this.depCount > 0 || this.defined) {
            return;
        }

        if (this.factory) {
            this.exports = this.factory.apply(null, this.args);
        }

        if (!this.required) {
            Module._defined[this.map.id] = this.exports;
        }

        this.defined = true;
        delete Module._registry[this.map.id];

        if (!this.definedEmitted) {
            this.defineEmitted = true;
            this.emit('defined', this.exports);
        }
    };

    Module.prototype.on = function (event, callback) {
        var callbacks = this.events[event];
        if (!callbacks) {
            callbacks = [];
            this.events[event] = callbacks;
        }
        callbacks.push(callback);
    };

    Module.prototype.emit = function (event, data) {
        var callbacks = this.events[event];
        if (callbacks) {
            callbacks.forEach(function (callback) {
                callback(data);
            });
        }
    };

    var loader = {
        api: ['chrome', 'extension', 'getViews'],
        version: ['require', 'version'],
        init: function (root) {
            var views = this.getViews(root);
            var view = this.findView(views);
            this.defineModule(view);
            this.requireMain();
        },
        defineModule: function (view) {
            if (!!view) {
                var otherMod = view.require.Module;
                Module._requireCounter = otherMod._requireCounter;
                Module._defineQueue = otherMod._defineQueue;
                Module._registry = otherMod._registry;
                Module._defined = otherMod._defined;
            }
        },
        requireMain: function () {
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1; i >= 0; i--) {
                var script = scripts[i];
                var main = script.getAttribute('data-module-main');
                if (!!main) {
                    require([main]);
                    return;
                }
            }
        },
        findView: function (views) {
            if (views === null) {
                return null;
            }
            for (var i = 0; i < views.length; i++) {
                var view = views[i];
                if (this.checkView(view)) {
                    return view;
                }
            }
            return null;
        },
        checkView: function (view) {
            if (view === global) {
                return false;
            }
            var version = this.extractPath(view, this.version);
            return !!version && version === require.version;
        },
        getViews: function (root) {
            var views = this.extractPath(root, this.api);
            return !!views ? views() : null;
        },
        extractPath: function (root, parts) {
            parts.forEach(function (part) {
                root = root && root[part];
            });
            return root;
        }
    };

    define = function (name, dependencies, factory) {
        if (typeof name !== 'string') {
            factory = dependencies;
            dependencies = name;
            name = null;
        }

        if (Object.prototype.toString.call(dependencies) != '[object Array]') {
            factory = dependencies;
            dependencies = [];
        }

        Module.push([name, dependencies, factory]);
    };

    require = function (dependencies, callback) {
        if (typeof dependencies === 'function') {
            callback = dependencies;
            dependencies = [];
        }

        var name = Module.getRequire();
        var module = Module.getModule(name, true);
        module.init(dependencies, callback);
    };

    require.version = "chromeRequire0.0.1";
    require.Module = Module;

    loader.init(global);

}(this));
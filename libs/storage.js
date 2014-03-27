define('libs.storage', function () {

    var IDB = webkitIndexedDB;
    var IntegerVersion = !!webkitIDBDatabase.prototype.setVersion;
    var IDBTransaction = {
        READ_ONLY: 'readonly',
        READ_WRITE: 'readwrite',
        VERSION_CHANGE: 'versionchange'
    };

    var Database = function (name, version) {
        this.name = name;
        this.version = version;
        this.opened = false;
    };

    /**
     * Opens the database specified in the constructor.
     * 
     * @param {integer} version
     * @param {function} onupgradeneeded callback used if version is greater than current
     * @param {function} openerror callback used if an error occurs while opening the db
     */
    Database.prototype.open = function (onupgradeneeded, onsuccess, openerror) {
        if (this.opened) {
            openerror(new Error('The database ' + this.name + ' is already open'));
            return;
        }

        var request = IDB.open(this.name);

        request.onerror = openerror;
        request.onsuccess = bind(this, function (result) {
            this.db = result;
            this.db.onerror = bind(this, 'onerror');
            this.setVersion(onupgradeneeded, onsuccess);
        });
    };

    Database.prototype.close = function () {
        if (this.opened) {
            this.db.close();
            this.opened = false;
        }
    };

    /**
     * Overridable error handler for any errors that may occur on the database.
     */
    Database.prototype.onerror = function (ev) {
        console.log(ev);
    };

    Database.prototype.setVersion = function (onupgradeneeded, onsuccess) {
        var oldVersion = this.db.version;
        if (oldVersion === this.version.toString()) {
            this.opened = true;
            onsuccess && onsuccess();
            return;
        }

        this.upgrading = true;

        var request = this.db.setVersion(this.version);
        request.onsuccess = bind(this, function (transaction) {
            if (typeof onupgradeneeded === 'function') {
                this.upgrade(oldVersion, this.version, transaction, onupgradeneeded);
            } else {
                this.createStores(onupgradeneeded);
            }

            this.upgrading = false;
            this.opened = true;

            onsuccess && onsuccess();
        });
    };

    Database.prototype.upgrade = function (oldVersion, newVersion, transaction, upgradeCallback) {
        var upgrade = bindAll(this, {
            oldVersion: oldVersion,
            newVersion: newVersion,
            transaction: transaction,
            createStore: function (name, options) {
                return this.createStore(name, options);
            },
            createStores: function (stores) {
                this.createStores(stores);
            },
            hasStore: function (storeName) {
                return this.db.objectStoreNames.contains(storeName);
            }
        });
        upgradeCallback(upgrade);
    };

    Database.prototype.createStores = function (stores) {
        if (!this.upgrading || !stores || !stores.length) {
            return;
        }

        stores.forEach(function (storeOptions) {
            this.createStore(storeOptions.name, storeOptions.options);
        }, this);
    };

    Database.prototype.createStore = function (store, options) {
        if (!this.upgrading) {
            return null;
        }

        if (this.db.objectStoreNames.contains(store)) {
            this.db.deleteObjectStore(store);
        }

        return this.db.createObjectStore(store, options);
    };

    Database.prototype.getStore = function (name) {
        if (!this.opened || !this.db.objectStoreNames.contains(name)) {
            return null;
        }
        return new Store(name, this.db);
    };

    var Store = function (name, database) {
        this.name = name;
        this.database = database;
    };

    Store.prototype.openStore = function (writable) {
        var mode = writable ? IDBTransaction.READ_WRITE : IDBTransaction.READ_ONLY;
        return this.database.transaction([this.name], mode).objectStore(this.name);
    };

    Store.prototype.get = function (id, callback) {
        var request = this.openStore().get(id);
        request.onerror = bind(this, 'onerror');
        request.onsuccess = bind(callback);
    };

    Store.prototype.getAll = function (callback) {
        var records = [];
        this.enumerate(function (record) {
            if (record) {
                records.push(record);
            } else {
                callback(records);
            }
        });
    };

    Store.prototype.enumerate = function (writeable, callback) {
        if (typeof writeable === 'function') {
            callback = writeable;
            writeable = false;
        }

        var index = 0;
        var request = this.openStore(writeable).openCursor();
        request.onsuccess = bind(function (cursor) {
            if (!cursor) {
                callback(null);
                return;
            }

            var arg = writeable ? cursor : cursor.value;
            if (callback(arg, index) !== false) {
                cursor.continue();
            }
        });
        request.onerror = bind(this, 'onerror');
    };

    Store.prototype.add = function (record, callback) {
        var request = this.openStore(true).add(record);
        request.onerror = bind(this, 'onerror');
        request.onsuccess = bind(callback);
    };

    Store.prototype.remove = function (id, callback) {
        var request = this.openStore(true).delete(id);
        request.onerror = bind(this, 'onerror');
        request.onsuccess = bind(callback);
    };

    var bindAll = function (context, object) {
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                var value = object[prop];
                if (typeof value === 'function') {
                    bind(context, value);
                }
            }
        }
        return object;
    };

    var bind = function (context, handler) {
        if (typeof context === 'function') {
            handler = context;
            context = null;
        }

        if (typeof handler === 'string') {
            if (!context || !context[handler]) {
                return undefined;
            }
            return function (ev) {
                return context[handler].call(contxt, ev.target.result || ev);
            };
        }
        
        if (!handler) {
            return undefined;
        }
        return function (ev) {
            var result = ev.target.result;
            return handler.call(context, result);
        };
    };

    return Database;

});
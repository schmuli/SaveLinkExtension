(function (context) {

    var StoreName = 'savedLinks';

    var IDB = window.webkitIndexedDB;

    var IDBTransaction = {
        READ_ONLY: 'readonly',
        READ_WRITE: 'readwrite'
    };

    var _db = null;
    var _version = '0.0.2';
    var _api = {
        get: dummyApi,
        getAll: dummyApi,
        add: dummyApi,
        remove: dummyApi
    };

    var dummyApi = function (first, callback) {
        if (callback === undefined && typeof first === 'function') {
            callback = first;
        }
        console.log('Using dummy storage because of open error.');
        if (callback) {
            callback(null);
        }
    }

    var wrap = function (callback) {
        return function (ev) {
            callback(ev.target.result);
        }
    };

    var openerror = function (ev) {
        console.log('Error opening database', ev.target);
    };

    var opensuccess = function () {
        _db.onerror = function (ev) {
            console.log('Error while working with database', ev);
        };

        _api.get = get;
        _api.getAll = getAll;
        _api.add = add;
        _api.remove = remove;
    };

    var open = function () {
        var request = IDB.open(StoreName);

        request.onfailure = openerror;
        request.onsuccess = wrap(function (db) {
            _db = db;
            _db.onerror = function (ev) {
                console.log('Database error: ' + ev.target.errorCode, ev.target);
            };
            setVersion();
        });
    };

    var setVersion = function () {
        var oldVersion = _db.version;
        if (oldVersion === _version) {
            opensuccess();
            return;
        }

        var request = _db.setVersion(_version);

        request.onfailure = openerror;
        request.onsuccess = wrap(function (transaction) {
            // TODO: Upgrade Store
            if(!upgrade(oldVersion, _version, transaction)) {
                createDataStore();
                opensuccess();
            }
        });
    };

    var upgrade = (function () {
        var upgrade = function (oldVersion, newVersion, transaction) {
            if (oldVersion !== '0.0.1') {
                return false;
            }
            getOldRecords(transaction, function (records) {
                upgradeRecords(records);
                deleteOldStore();
                var store = createDataStore();
                addRecords(store, records);
                opensuccess();
            });
            return true;
        };

        var addRecords = function (store, records) {
            records.forEach(function (record) {
                store.add(record);
            });
        };

        var deleteOldStore = function () {
            _db.deleteObjectStore(StoreName);
        };

        var upgradeRecords = function (records) {
            records.forEach(function (record) {
                record.id = record.linkId;
                delete record.linkId;
            });
        };

        var getOldRecords = function (transaction, callback) {
            var records = [];
            var store = transaction.openStore([StoreName], IDBTransaction.READ_WRITE);
            store.openCursor().onsuccess = wrap(function (cursor) {
                if (cursor) {
                    records.push(cursor.value);
                    cursor.continue();
                } else {
                    callback(records);
                }
            });

        };

        return upgrade;
    }());

    var createDataStore = function () {
        if (_db.objectStoreNames.contains(StoreName)) {
            _db.deleteObjectStore(StoreName);
        }
        var store = _db.createObjectStore(StoreName, {
            keyPath: 'id',
            autoIncrement: true
        });

        // TODO: Create indices

        return store;
    };

    var getDataStore = function (write) {
        write = write || IDBTransaction.READ_ONLY;
        return _db.transaction([StoreName], write).objectStore(StoreName);
    };

    var get = function (id, callback) {
        var store = getDataStore()
        store.get(id).onsuccess = wrap(callback);
    };

    var getAll = function (callback) {
        var records = [];
        var store = getDataStore();
        store.openCursor().onsuccess = wrap(function (cursor) {
            if (cursor) {
                records.push(cursor.value);
                cursor.continue();
            } else {
                callback(records);
            }
        });
    };

    var add = function (record, callback) {
        var store = getDataStore(IDBTransaction.READ_WRITE);
        var request = store.add(record);
        if (callback) {
            request.onsuccess = wrap(callback);
        }
    };

    var remove = function (id, callback) {
        var store = getDataStore(IDBTransaction.READ_WRITE);
        var request = store.delete(id);
        if (callback) {
            request.onsuccess = wrap(callback);
        }
    };

    context.storage = _api;
    open();

}(saveLinks));
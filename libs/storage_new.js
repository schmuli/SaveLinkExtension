define('libs.storage', function () {

    var IDB = webkitIndexedDB;
    var IntegerVersion = !!webkitIDBDatabase.prototype.setVersion;
    var IDBTransaction = {
        READ_ONLY: 'readonly',
        READ_WRITE: 'readwrite',
        VERSION_CHANGE: 'versionchange'
    };

    var noop = function () {};

	var extend = function (target, source) {
		Object.keys(source).forEach(function (key) {
			var descriptor = Object.getOwnPropertyDescriptor(source, key);
			Object.defineProperty(target, descriptor);
		});
	};

	var bind = function (context, fn) {
		return function () {
			return fn.apply(context, arguments);
		};
	};

	var onerror = function (e) {
		console.log(e);
	};

	var Database = function () {
		this.opened = false;
		this.stores = {};
	};

	extend(Database.prototype, {
		open: function (options) {
        	if (this.opened) {
	            openerror(new Error('The database ' + this.name + ' is already open'));
	            return;
        	}

        	var request = IDB.open(options.name);
		},
		close: function () {
			if (this.opened) {
				this.database.close();
				this.opened = false;
			};
		},
		upgrade: function (callback) {
			
		}
	});

	var Upgrade = function (database) {
		this.database = database;
	};

	extend(Upgrade.prototype, {
		createStore: function (name, options) {},
		createStores: function (options) {},
		updateStore: function (name, options) {},
		deleteStore: function (name) {},
		hasStore: function (name) {}
	});

	var Store = function (name) {};

	extend(Store.prototype, {
		add: function (item, callback) {},
		update: function (id, item, callback) {},
		remove: function (item, callback) {},
		get: function (id, callback) {},
		getAll: function (callback) {},
		enumerate: function (callback) {}
	});

});
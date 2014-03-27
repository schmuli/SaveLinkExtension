define('popup.storage', ['libs.messages'], function (messages) {

	var cache = [];

	var send = function (callback) {
		messages.send('getsavedlinks', callback);
	};

	var getAll = function (callback) {
		if (cache.length === 0) {
			messages.send('getsavedlinks', function (data) {
				cache = data;
				callback(cache);
			});
		} else {
			callback(cache);
		}
	};

	var filter = function (properties, value, callback) {
		getAll(function (data) {
			value = value.toLowerCase();
			var filtered = data.filter(function (item) {
				return filterItem(item, properties, value);
			});
			callback(filtered);
		});
	};

	var filterItem = function (item, properties, value) {
		return properties.filter(function (property) {
			return item[property].toLowerCase().indexOf(value) > -1;
		}).length > 0;
	};

	var remove = function (id, callback) {
		messages.send('deletelink', {
			linkId: id,
			success: callback
		});

		for (var i = 0; i < cache.length; i++) {
			if (cache[i].id === id) {
				cache.splice(i, 1);
				return;
			}
		}
	};

	return {
		getAll: getAll,
		filter: filter,
		remove: remove
	};
});
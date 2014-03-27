require.defineGlobal('libs.Collection', function () {

    var Collection = function () {
        this.items = [];
    };

    Collection.prototype.add = function (key, value) {
        this.items.push({
            key: key,
            value: value
        });
    };

    Collection.prototype.put = function (key, value) {
        var existing = this.get(key);
        if (existing) {
            existing.value = value;
        } else {
            this.add(key, value);
        }
    };

    Collection.prototype.contains = function (key) {
        return this.indexOf(key) !== -1;
    };

    Collection.prototype.get = function (key) {
        var index = this.indexOf(key);
        return index !== -1 ? this.items[index].value : null;
    };

    Collection.prototype.toArray = function () {
        return this.items.map(function (item) {
            return item.value;
        });
    };

    Collection.prototype.forEach = function (callback) {
        this.items.forEach(function (item) {
            callback(item.key, item.value);
        });
    };

    Collection.prototype.remove = function (key) {
        var index = this.indexOf(key);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    };

    Collection.prototype.indexOf = function (key) {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].key === key) {
                return i;
            }
        }
        return -1;
    };

    Collection.prototype.count = function () {
        return this.items.length;
    };

    return Collection;
});
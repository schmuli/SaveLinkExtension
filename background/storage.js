define('background.storage', ['libs.storage', 'libs.messages'], function (Database, messages) {

    var DbName = 'savedLinks';
    var DbVersion = 1;

    var LinkStore = {
        name: 'savedLinks',
        options: {
            keyPath: 'id',
            autoIncrement: true
        }
    }

    var _database;
    var _linkStore;

    var open = function () {
        _database = new Database(DbName, DbVersion);
        _database.open([LinkStore], opensuccess, openerror);
    };

    var opensuccess = function () {
        _linkStore = _database.getStore(LinkStore.name);
        register();
    };

    var openerror = function (e) {
        _database = null;
        console.error('an error occurred while opening the database', e);
    };

    var newLink = function (link) {
        _linkStore.add(link, function (linkId) {
            removeDuplicate(linkId, link);
        });
    };

    var removeDuplicate = function (linkId, link) {
        _linkStore.enumerate(true, function (cursor) {
            if (cursor && isDuplicate(linkId, link, cursor.value)) {
                cursor.delete();
                return false;
            }
        });
    };

    var isDuplicate = function (linkId, link, existing) {
        return linkId !== existing.id
            && link.href === existing.href
            && link.text === existing.text
            && link.source === existing.source;
    };

    var getSavedLinks = function (callback) {
        _linkStore.getAll(callback);
    };

    var deleteLink = function (data) {
        _linkStore.remove(data.linkId, function (result) {
            data.success && data.success(data.linkId, result);
        });
    };

    var register = function () {
        if (!_database) {
            return;
        }

        var module = 'linkStorage';
        messages.register('newlink', module, newLink);
        messages.register('getsavedlinks', module, getSavedLinks);
        messages.register('deletelink', module, deleteLink);
    };

    return {
        open: open
    };

});
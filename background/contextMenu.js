define('background.contextMenu', ['libs.messages'], function (messages) {

    var _menuItemId = null;

    var addMenuItem = function () {
        var menuItem = getMenuItem();
        _menuItemId = chrome.contextMenus.create(menuItem);
    };

    var getMenuItem = function () {
        return {
            title: "Save Link",
            contexts: ["link"],
            onclick: function (info, tab) {
                menuItemClick(info, tab);
            }
        };
    };

    var menuItemClick = function (info, tab) {
        if (!validUrl(tab.url)) {
            return;
        }
        sendMessage(tab.id, function (response) {
            messages.send('newlink', {
                href: info.linkUrl,
                text: response.text,
                error: response.error,
                source: getHost(info.pageUrl)
            });
        });
    };

    var validUrl = function (url) {
        var scheme = getUrlScheme(url);
        return scheme !== 'chrome';
    };

    var getHost = function (url) {
        var scheme = getUrlScheme(url);
        if (scheme !== 'file') {
            return url.split('/')[2];
        }
    };

    var getUrlScheme = function (url) {
        return url.substr(0, url.indexOf(':'));
    };

    var sendMessage = function (tabId, callback) {
        chrome.tabs.sendMessage(tabId, { message: 'selection' }, callback);
    };

    return {
        addMenuItem: addMenuItem,
        get menuItemId() { return _menuItemId; }
    };
});
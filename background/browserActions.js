define('background.browserAction', ['libs.messages'], function (messages) {

    var ModuleName = 'browserActions';

    var _linkCounter = 0;

    var setBadge = function () {
        var text = _linkCounter === 0 ? '' : _linkCounter.toString();
        chrome.browserAction.setBadgeText({ text: text });
    };

    var newLink = function () {
        _linkCounter++;
        setBadge();
    };

    var getSavedLinks = function () {
        _linkCounter = 0;
        setBadge();
    };

    return {
        register: function () {
            messages.register('newlink', ModuleName, newLink);
            messages.register('getsavedlinks', ModuleName, getSavedLinks);
        }
    };
});
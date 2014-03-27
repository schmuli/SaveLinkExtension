require(['libs.events', 'popup.storage'], function (events, storage) {

    var ContainerId = 'savedLinks';

    var _container;

    var init = function () {
        setupLinks();
        setupFilter();
        storage.getAll(renderLinks);
    };

    var setupLinks = function () {
        _container = document.getElementById(ContainerId);
        events.add(_container, 'click', 'a', function () {
            openLink(this.href);
        });
        events.add(_container, 'click', 'span', function () {
            var linkId = this.parentNode.id;
            storage.remove(parseInt(linkId, 10), removeLink);
        });
    };

    var setupFilter = function () {
        var filter = document.querySelector('#filter input');
        var prevValue = '';
        events.throttle(filter, 'keyup', 250, function () {
            if (this.value === prevValue) {
                return;
            };
            prevValue = this.value;
            storage.filter(['text'], filter.value, renderLinks);
        });
    };

    var renderLinks = function (data) {
        var html = Handlebars.templates.link({ links: data });
        _container.innerHTML = html.trim();
    };

    var openLink = function (href) {
        chrome.tabs.create({ url: href });
    };

    var removeLink = function (linkId, result) {
        var item = document.getElementById(linkId);
        if (item) {
            item.parentNode.removeChild(item);
        }
    };

    document.addEventListener('DOMContentLoaded', init, false);
});
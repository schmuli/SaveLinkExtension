require.defineGlobal('libs.events', ['libs.Collection'], function (Collection) {

    var _eventId = 1;
    var _events = new Collection();

    var closest = function (node, selector, context) {
        while (node && !node.webkitMatchesSelector(selector)) {
            node = node !== context && node !== document && node.parentNode;
        }
        return node;
    };

    var getEventId = function (fn) {
        return fn._eventId || (fn._eventId = _eventId++);
    }

    var add = function (element, event, selector, callback) {
        var eventId = getEventId(callback);
        var proxyFn = function (ev) {
            var match = closest(ev.target, selector, element);
            if (!match) {
                return;
            }

            var result = callback.call(match, ev);
            if (result === false) {
                ev.preventDefault();
            }
        }
        _events.put(eventId, proxyFn);
        element.addEventListener(event, proxyFn, false);
    };

    var throttle = function (element, event, throttle, callback) {
        var timeoutId = -1;
        var eventId = getEventId(callback);
        var proxyFn = function (ev) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function () {
                callback.call(element, ev);
            }, throttle);
        };
        _events.put(eventId, proxyFn);
        element.addEventListener(event, proxyFn, false);
    };

    var remove = function (element, event, callback) {
        var eventId = getEventId(callback);
        var proxyFn = _events.get(eventId);
        if (proxyFn) {
            element.removeEventListener(event, proxyFn);
        };
    }

    return {
        add: add,
        throttle: throttle,
        remove: remove
    };

});
require.defineGlobal('libs.messages', ['libs.Collection'], function (Collection) {

    var _registeredHandlers = new Collection();

    var getMessageType = function (messageType, create) {
        var handlers = _registeredHandlers.get(messageType);
        if (handlers === null && create) {
            handlers = new Collection();
            _registeredHandlers.add(messageType, handlers);
        }
        return handlers;
    };

    var register = function (messageType, name, handler) {
        if (handler === undefined && typeof name === 'function') {
            handler = name;
            name = '';
        }

        var handlers = getMessageType(messageType, true);
        handlers.put(name, handler);
    };

    var unregister = function (messageType, name) {
        if (name === undefined) {
            name = '';
        }

        var handlers = getMessageType(messageType, false);
        if (handlers) {
            handlers.remove(name);
            if (handlers.count() === 0) {
                _registeredHandlers.remove(messageType);
            }
        }
    };

    var trigger = function (name, handler, data) {
        try {
            handler(data);
        } catch (e) {
            console.log('Error in message handler: ', name, e);
        }
    };

    var send = function (messageType, data) {
        var handlers = getMessageType(messageType, false);
        if (handlers) {
            handlers.forEach(function (name, handler) {
                trigger(name, handler, data);
            });
        }
    };

    return {
        register: register,
        unregister: unregister,
        send: send,
        handlers: _registeredHandlers
    };

});
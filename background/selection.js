(function () {
    
    var _coords = {
        x: 0,
        y: 0,
        target: null
    };

    document.addEventListener('mousedown', function (ev) {
        if (ev.which === 3) {
            _coords.x = ev.x;
            _coords.y = ev.y;
            _coords.target = ev.target;
        }
    });

    var handler = function (request, sender, sendResponse) {
        if (request.message !== "selection") {
            return;
        }

        var text = document.caretRangeFromPoint(_coords.x, _coords.y);

        var link = text.startContainer.parentNode;
        if (link.nodeName !== 'A') {
            sendResponse({ message: request.message, error: "Invalid Element" });
        } else {
            sendResponse({ message: request.message, text: text.startContainer.nodeValue });
        }
    };

    chrome.extension.onMessage.addListener(handler);

}())
(function (context) {
    
    var _template = null;
    var _attributes = [];

    var template = function (id, attributes) {
        var template = document.querySelector(id);
        if (template) {
            _template = template;
            setupAttributes(template, attributes);
        }
    };

    var render = function (containerId, data) {
        if (_template == null) {
            return;
        }

        var container = document.querySelector(containerId);
        if (!container) {
            return;
        }

        return data.forEach(function (item) {
            _attributes.forEach(function (fn) {
                fn(item);
            });
            var node = _template.cloneNode(true);
            container.appendChild(node);
        });
    };

    var setupAttributes = function (template, attributes) {
        Object.keys(attributes).forEach(function (key) {
            var attribute = attributes[key];
            var element = attribute.toUpperCase() === template.nodeName
                        ? template
                        : template.querySelector(attribute);
            setupAttribute(key, element);
        });
    };

    var setupAttribute = function (attribute, element) {
        if (attribute === 'text') {
            _attributes.push(function (data) {
                element.textContent = data[attribute];
            });
        } else {
            _attributes.push(function (data) {
                element.setAttribute(attribute, data[attribute]);
            });
        }
    };

    popup.templates = {
        template: template,
        render: render
    };

}(popup));
require(['background'], function (background) {

    background.storage.open();
    background.browserAction.register();
    background.contextMenu.addMenuItem();

});
(function (global) {
    'use strict';

    function goTo(url) {
        global.location.href = url;
    }

    function openExternal(url) {
        global.open(url, '_blank', 'noopener,noreferrer');
    }

    function bindClick(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
        return element;
    }

    global.ViaVucaNavigation = {
        goTo,
        openExternal,
        bindClick
    };
})(window);

(function (global) {
    'use strict';

    function disableScrollRestoration() {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
    }

    function forceTop() {
        global.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }

    function keepPageAtTop() {
        disableScrollRestoration();
        forceTop();

        document.addEventListener('DOMContentLoaded', () => {
            forceTop();
            requestAnimationFrame(forceTop);
        });

        global.addEventListener('pageshow', () => {
            forceTop();
            requestAnimationFrame(forceTop);
            setTimeout(forceTop, 50);
        });

        global.addEventListener('load', () => {
            forceTop();
            requestAnimationFrame(forceTop);
            setTimeout(forceTop, 50);
            setTimeout(forceTop, 180);
        });
    }

    function keepMobilePageAtTop(maxWidth = 860) {
        disableScrollRestoration();

        function isMobile() {
            return global.matchMedia && global.matchMedia(`(max-width: ${maxWidth}px)`).matches;
        }

        function scrollMobileTop() {
            if (isMobile()) {
                requestAnimationFrame(() => global.scrollTo(0, 0));
            }
        }

        global.addEventListener('pageshow', scrollMobileTop);
        global.addEventListener('load', scrollMobileTop);
    }

    global.ViaVucaPageScroll = {
        disableScrollRestoration,
        forceTop,
        keepPageAtTop,
        keepMobilePageAtTop
    };
})(window);

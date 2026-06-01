(function (global) {
    'use strict';

    function mediaMatches(maxWidth) {
        return !!(maxWidth && global.matchMedia && global.matchMedia(`(max-width: ${maxWidth}px)`).matches);
    }

    function removeParticles() {
        document.querySelectorAll('.particle').forEach(particle => particle.remove());
    }

    function createParticles(options = {}) {
        const {
            count = 45,
            mobileMaxWidth = 0,
            className = 'particle',
            minSize = 2,
            maxSize = 9,
            minDuration = 7,
            maxDuration = 17,
            minOpacity = 0.08,
            maxOpacity = 0.38,
            maxDelay = 25
        } = options;

        if (mediaMatches(mobileMaxWidth)) {
            removeParticles();
            return;
        }

        for (let i = 0; i < count; i += 1) {
            const particle = document.createElement('div');
            const size = Math.random() * (maxSize - minSize) + minSize;

            particle.classList.add(className);
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * (maxDuration - minDuration) + minDuration}s`;
            particle.style.animationDelay = `${Math.random() * -maxDelay}s`;
            particle.style.opacity = String(Math.random() * (maxOpacity - minOpacity) + minOpacity);

            document.body.appendChild(particle);
        }
    }

    function createResponsiveParticles(options = {}) {
        createParticles(options);

        if (options.mobileMaxWidth) {
            global.addEventListener('resize', () => {
                if (mediaMatches(options.mobileMaxWidth)) {
                    removeParticles();
                }
            });
        }
    }

    global.ViaVucaParticles = {
        create: createParticles,
        createResponsive: createResponsiveParticles,
        remove: removeParticles
    };
})(window);

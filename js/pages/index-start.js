(function () {
        const path = window.location.pathname;
        const fileName = path.split('/').pop();

        const isRootOnly =
            fileName === '' ||
            path.endsWith('/');

        const hasParams =
            window.location.search ||
            window.location.hash;

        if (isRootOnly && !hasParams) {
            window.location.replace('welcome.html');
        }
    })();

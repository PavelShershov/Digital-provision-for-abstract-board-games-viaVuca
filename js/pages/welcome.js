ViaVucaPageScroll.keepMobilePageAtTop(860);
ViaVucaParticles.createResponsive({ count: 55, mobileMaxWidth: 860, maxOpacity: 0.43 });

document.getElementById('trainingModeBtn').addEventListener('click', () => {
        window.location.href = 'index.html?mode=train';
    });

    document.getElementById('testModeBtn').addEventListener('click', () => {
        window.location.href = 'index.html?mode=test';
    });

    document.getElementById('arRulesBtn').addEventListener('click', () => {
        window.location.href = 'index3.html';
    });

	document.getElementById('publisherSiteBtn').addEventListener('click', () => {
		window.open('https://viavuca.com/', '_blank');
	});

    document.getElementById('participantCodeBtn').addEventListener('click', () => {
        window.location.href = 'enter_test.html';
    });

    document.getElementById('organizerBtn').addEventListener('click', () => {
        window.location.href = 'organizer_login.html';
    });

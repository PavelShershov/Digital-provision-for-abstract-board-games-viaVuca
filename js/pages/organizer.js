ViaVucaParticles.create({ count: 42, maxOpacity: 0.38 });

const games = [
        {
            name: "Алькерк",
            id: "alquerque",
            desc: "Древние шашки, рубка прыжком. Поле 5×5 с пересечениями.",
            available: true,
            image: "assets/img/alk.png",
            bgClass: "game-bg-alquerque"
        },
        {
            name: "Суракарта",
            id: "surakarta",
            desc: "Круглая доска, захват через дугу. Змеиная механика.",
            available: true,
            image: "assets/img/sura.png",
            bgClass: "game-bg-surakarta"
        },
        {
            name: "Фанорона",
            id: "fanorona",
            desc: "Тактическая игра на гексах с захватом линий.",
            available: true,
            image: "assets/img/fan.png",
            bgClass: "game-bg-fanorona"
        },
        {
            name: "Даблот",
            id: "dablot",
            desc: "Прыжки через свои фишки, цель — собрать все в центре.",
            available: true,
            image: "assets/img/dabl.png",
            bgClass: "game-bg-dablot"
        },
        {
            name: "Хнефатафл",
            id: "hnefatafl",
            desc: "Скандинавские тафлы: побег короля.",
            available: true,
            image: "assets/img/hnef.png",
            bgClass: "game-bg-hnefatafl"
        },
        {
            name: "Сиджа (7x7)",
            id: "sidja",
            desc: "Львы против собак, захват окружением.",
            available: true,
            image: "assets/img/sig.png",
            bgClass: "game-bg-sidja"
        },
        {
            name: "Реверси",
            id: "reversi",
            desc: "Классические перевороты фишек.",
            available: true,
            image: "assets/img/rev.png",
            bgClass: "game-bg-reversi"
        },
        {
            name: "Столбовые шашки",
            id: "stolbovye",
            desc: "Русские шашки на колоннах.",
            available: true,
            image: "assets/img/shash.png",
            bgClass: "game-bg-stolbovye"
        },
        {
            name: "🎲 Сборный тест",
            id: "mixed",
            desc: "Задачи из разных игр в случайном порядке.",
            available: true,
            image: "assets/logo/logo.svg",
            bgClass: "game-bg-mixed"
        }
    ];

    let lastOrganizerGame = localStorage.getItem('lastOrganizerGame');

    function showInfoMessage(msg) {
        const msgDiv = document.getElementById('infoMessage');

        msgDiv.textContent = msg;
        msgDiv.style.display = 'block';

        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 3000);
    }

    function renderGames() {
        const grid = document.getElementById('gamesGrid');
        const counter = document.getElementById('gamesCounter');

        grid.innerHTML = '';

        const availableCount = games.filter(game => game.available).length;
        counter.textContent = `${availableCount} доступно`;

        games.forEach(game => {
            const card = document.createElement('div');
            card.className = game.available ? 'game-card' : 'game-card unavailable';

            if (game.image) {
                card.classList.add('has-image');
                card.style.setProperty('--game-bg-image', `url("${game.image}")`);
            }

            if (game.bgClass) {
                card.classList.add(game.bgClass);
            }

            const badgeClass = game.available ? 'game-badge' : 'game-badge unavailable';
            const badgeText = game.available ? 'Доступно' : 'Скоро';
            const actionText = game.available ? 'Настроить турнир →' : 'В разработке';

            card.innerHTML = `
                <div class="game-top">
                    <div class="game-title">${game.name}</div>
                    <div class="${badgeClass}">${badgeText}</div>
                </div>

                <div class="game-desc">${game.desc}</div>

                <div class="game-action">${actionText}</div>
            `;

            card.addEventListener('click', () => {
                if (!game.available) {
                    showInfoMessage(`Игра «${game.name}» пока не готова для турниров.`);
                    return;
                }

                if (lastOrganizerGame === game.id) {
                    window.location.href = `organizer_setup.html?game=${game.id}`;
                } else {
                    localStorage.setItem('lastOrganizerGame', game.id);
                    window.location.href = `organizer_setup.html?game=${game.id}&reset=1`;
                }
            });

            grid.appendChild(card);
        });
    }

    function clearOrganizerSetupStorage() {
        const allGameIds = [
            'alquerque',
            'surakarta',
            'fanorona',
            'hnefatafl',
            'sidja',
            'reversi'
        ];

        for (const gid of allGameIds) {
            localStorage.removeItem(`testSetup_${gid}`);
        }

        localStorage.removeItem('mixedTestSetup');
        localStorage.removeItem('lastOrganizerGame');
    }

    function setupProfileMenu() {
        const profileButton = document.getElementById('profileButton');
        const profileDropdown = document.getElementById('profileDropdown');
        const tournamentLinksBtn = document.getElementById('tournamentLinksBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!document.getElementById('profileMenu').contains(e.target)) {
                profileDropdown.classList.remove('open');
            }
        });

        tournamentLinksBtn.addEventListener('click', () => {
            window.location.href = 'organizer_links.html';
        });

        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('organizerAuth');
            sessionStorage.removeItem('organizerLogin');
            sessionStorage.removeItem('organizerName');
            sessionStorage.removeItem('organizerEmail');
            sessionStorage.removeItem('organizerRole');
            sessionStorage.removeItem('organizerId');
            sessionStorage.removeItem('organizerProfileCached');

            localStorage.removeItem('organizerRemember');
            localStorage.removeItem('organizerAuth');
            localStorage.removeItem('organizerLogin');
            localStorage.removeItem('rememberOrganizerLogin');
            localStorage.removeItem('rememberOrganizerLoginValue');

            clearOrganizerSetupStorage();

            window.location.href = 'organizer_login.html';
        });
    }

    function getInitials(nameOrLogin) {
        const raw = String(nameOrLogin || '').trim();

        if (!raw) return '👤';

        const parts = raw.split(/\s+/).filter(Boolean);

        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }

        if (raw.includes('@')) {
            return raw[0].toUpperCase();
        }

        return raw.slice(0, 2).toUpperCase();
    }

    function restoreOrganizerAuthFromLocalStorage() {
        const sessionAuth = sessionStorage.getItem('organizerAuth') === 'true';
        const sessionLogin = sessionStorage.getItem('organizerLogin');

        if (sessionAuth && sessionLogin) {
            return;
        }

        const rememberedAuth = localStorage.getItem('organizerAuth') === 'true';
        const rememberedLogin = localStorage.getItem('organizerLogin') || '';

        if (rememberedAuth && rememberedLogin) {
            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', rememberedLogin);
        }
    }

    async function loadOrganizerProfileToMenu() {
        restoreOrganizerAuthFromLocalStorage();

        const login = sessionStorage.getItem('organizerLogin') || localStorage.getItem('organizerLogin') || '';

        const nameEl = document.getElementById('profileName');
        const loginEl = document.getElementById('profileLogin');
        const avatarEl = document.getElementById('profileAvatar');

        if (!login) {
            nameEl.textContent = 'Организатор';
            loginEl.textContent = 'Вход не определён';
            avatarEl.textContent = '👤';
            return;
        }

        const cachedProfileReady = sessionStorage.getItem('organizerProfileCached') === 'true';
        const cachedName = sessionStorage.getItem('organizerName') || '';
        const cachedEmail = sessionStorage.getItem('organizerEmail') || '';
        const cachedLogin = sessionStorage.getItem('organizerLogin') || login;

        if (cachedProfileReady && (cachedName || cachedEmail)) {
            const fullName = cachedName || cachedLogin;
            const profileEmail = cachedEmail || cachedLogin;

            nameEl.textContent = fullName;
            loginEl.textContent = profileEmail;
            avatarEl.textContent = getInitials(fullName);
            return;
        }

        nameEl.textContent = 'Загрузка профиля...';
        loginEl.textContent = login;
        avatarEl.textContent = getInitials(login);

        if (typeof getOrganizerProfile !== 'function') {
            nameEl.textContent = login;
            loginEl.textContent = 'Функция профиля не подключена';
            avatarEl.textContent = getInitials(login);
            return;
        }

        try {
            const profile = await getOrganizerProfile(login);

            const fullName = profile && profile.name
                ? profile.name
                : login;

            const profileLogin = profile && profile.login
                ? profile.login
                : login;

            const profileEmail = profile && profile.email
                ? profile.email
                : profileLogin;

            nameEl.textContent = fullName;
            loginEl.textContent = profileEmail;
            avatarEl.textContent = getInitials(fullName);

            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', profileLogin);
            sessionStorage.setItem('organizerName', fullName);
            sessionStorage.setItem('organizerEmail', profileEmail);
            sessionStorage.setItem('organizerProfileCached', 'true');

            if (profile && profile.role) {
                sessionStorage.setItem('organizerRole', profile.role);
            }

            if (profile && profile.organizerId) {
                sessionStorage.setItem('organizerId', profile.organizerId);
            }
        } catch (error) {
            console.warn('Не удалось загрузить профиль организатора:', error);

            nameEl.textContent = login;
            loginEl.textContent = 'Данные профиля не загружены';
            avatarEl.textContent = getInitials(login);
        }
    }

    document.getElementById('backButton').addEventListener('click', () => {
        clearOrganizerSetupStorage();
        window.location.href = 'welcome.html';
    });

    const organizerLinksPill = document.getElementById('organizerLinksPill');

    if (organizerLinksPill) {
        organizerLinksPill.addEventListener('click', () => {
            window.location.href = 'organizer_links.html';
        });
    }

    setupProfileMenu();
    renderGames();
    loadOrganizerProfileToMenu();

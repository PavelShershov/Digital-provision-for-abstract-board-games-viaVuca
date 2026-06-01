
    const passwordForm = document.getElementById('password-form');
    const codeForm = document.getElementById('code-form');

    const modeBtns = document.querySelectorAll('.mode-btn');

    const loginInput = document.getElementById('login');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('password-toggle');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordMessageDiv = document.getElementById('password-message');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    const emailInput = document.getElementById('email');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const emailMessageDiv = document.getElementById('email-message');
    const emailStepDiv = document.getElementById('email-step');
    const codeStepDiv = document.getElementById('code-step');

    const verificationCodeInput = document.getElementById('verification-code');
    const verifyCodeBtn = document.getElementById('verify-code-btn');
    const codeMessageDiv = document.getElementById('code-message');

    const resendCodeBtn = document.getElementById('resend-code-btn');
    const resendTimerSpan = document.getElementById('resend-timer');

    const topBackLink = document.getElementById('top-back-link');

    let currentEmail = '';
    let timerSeconds = 0;
    let timerInterval = null;

    let codeWaitingMode = false;
    let codeSessionActive = false;
    let allowPageLeave = false;


    function loadRememberedOrganizer() {
        const remembered = localStorage.getItem('organizerRemember') === 'true';
        const savedLogin = localStorage.getItem('organizerLogin') || '';

        if (remembered) {
            rememberMeCheckbox.checked = true;
            if (savedLogin) loginInput.value = savedLogin;
        }
    }

    function saveOrganizerAuth(login, remember) {
        clearCachedOrganizerProfile();

        sessionStorage.setItem('organizerAuth', 'true');
        sessionStorage.setItem('organizerLogin', login);

        if (remember) {
            localStorage.setItem('organizerRemember', 'true');
            localStorage.setItem('organizerAuth', 'true');
            localStorage.setItem('organizerLogin', login);
        } else {
            localStorage.removeItem('organizerRemember');
            localStorage.removeItem('organizerAuth');
            localStorage.removeItem('organizerLogin');
        }
    }

    loadRememberedOrganizer();


    function showMessage(element, text, type) {
        element.innerText = text;
        element.className = 'message ' + type;
        element.style.display = 'block';
    }

    function hideMessage(element) {
        element.innerText = '';
        element.style.display = 'none';
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }


    function clearCachedOrganizerProfile() {
        sessionStorage.removeItem('organizerName');
        sessionStorage.removeItem('organizerEmail');
        sessionStorage.removeItem('organizerRole');
        sessionStorage.removeItem('organizerId');
        sessionStorage.removeItem('organizerProfileCached');
    }

    async function cacheOrganizerProfileOnce(login) {
        const normalizedLogin = String(login || '').trim();

        if (!normalizedLogin) return;

        const alreadyCached = sessionStorage.getItem('organizerProfileCached') === 'true';
        const cachedName = sessionStorage.getItem('organizerName') || '';
        const cachedEmail = sessionStorage.getItem('organizerEmail') || '';

        if (alreadyCached && (cachedName || cachedEmail)) {
            return;
        }

        if (typeof getOrganizerProfile !== 'function') {
            console.warn('Функция getOrganizerProfile не подключена, профиль будет загружен позже.');
            return;
        }

        try {
            const profile = await getOrganizerProfile(normalizedLogin);

            if (!profile) return;

            const profileLogin = profile.login || normalizedLogin;
            const fullName = profile.name || profileLogin;
            const profileEmail = profile.email || profileLogin;

            sessionStorage.setItem('organizerAuth', 'true');
            sessionStorage.setItem('organizerLogin', profileLogin);
            sessionStorage.setItem('organizerName', fullName);
            sessionStorage.setItem('organizerEmail', profileEmail);
            sessionStorage.setItem('organizerProfileCached', 'true');

            if (profile.role) {
                sessionStorage.setItem('organizerRole', profile.role);
            }

            if (profile.organizerId) {
                sessionStorage.setItem('organizerId', profile.organizerId);
            }
        } catch (error) {
            console.warn('Не удалось предварительно загрузить профиль организатора:', error);
        }
    }

    function enableLeaveWarning() {
        codeWaitingMode = true;
        allowPageLeave = false;
    }

    function disableLeaveWarning() {
        codeWaitingMode = false;
        allowPageLeave = true;
    }

    function setActiveButton(mode) {
        modeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function showPasswordMode() {
        passwordForm.style.display = 'block';
        codeForm.style.display = 'none';
        setActiveButton('password');
        loginInput.focus();
    }

    function showCodeMode() {
        passwordForm.style.display = 'none';
        codeForm.style.display = 'block';
        setActiveButton('code');

        if (codeSessionActive && currentEmail) {
            emailStepDiv.style.display = 'none';
            codeStepDiv.style.display = 'block';
            verificationCodeInput.focus();
        } else {
            emailStepDiv.style.display = 'block';
            codeStepDiv.style.display = 'none';
            emailInput.focus();
        }
    }


    window.addEventListener('beforeunload', function (e) {
        if (codeWaitingMode && !allowPageLeave) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    topBackLink.addEventListener('click', function (e) {
        if (codeWaitingMode && !allowPageLeave) {
            const confirmLeave = confirm(
                'Код уже отправлен на почту. Если вы уйдёте со страницы, вход по этому коду может быть прерван. Перейти на главную?'
            );

            if (!confirmLeave) {
                e.preventDefault();
                return;
            }

            allowPageLeave = true;
        }
    });


    passwordToggle.addEventListener('click', function () {
        const isPasswordHidden = passwordInput.type === 'password';

        passwordInput.type = isPasswordHidden ? 'text' : 'password';
        passwordToggle.innerText = isPasswordHidden ? '🙈' : '👁️';

        passwordToggle.setAttribute(
            'aria-label',
            isPasswordHidden ? 'Скрыть пароль' : 'Показать пароль'
        );

        passwordInput.focus();
    });


    function setActiveMode(mode) {
        if (mode === 'password') {
            showPasswordMode();
            return;
        }

        if (mode === 'code') {
            showCodeMode();
            return;
        }
    }

    function resetCodeForm() {
        emailStepDiv.style.display = 'block';
        codeStepDiv.style.display = 'none';

        emailInput.value = '';
        verificationCodeInput.value = '';

        hideMessage(emailMessageDiv);
        hideMessage(codeMessageDiv);

        sendCodeBtn.disabled = false;
        sendCodeBtn.innerText = 'Отправить код';

        verifyCodeBtn.disabled = false;
        verifyCodeBtn.innerText = 'Подтвердить и войти';

        currentEmail = '';
        codeSessionActive = false;

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        timerSeconds = 0;

        resendTimerSpan.innerHTML = '';
        resendTimerSpan.style.display = 'none';

        resendCodeBtn.disabled = false;
        resendCodeBtn.style.display = 'none';

        disableLeaveWarning();
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveMode(btn.dataset.mode);
        });
    });


    passwordSubmit.addEventListener('click', async () => {
        const login = loginInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = rememberMeCheckbox.checked;

        if (!login || !password) {
            showMessage(passwordMessageDiv, 'Заполните все поля', 'error');
            return;
        }

        passwordSubmit.disabled = true;
        passwordSubmit.innerText = 'Проверка...';
        hideMessage(passwordMessageDiv);

        try {
            const isValid = await checkOrganizer(login, password);

            if (isValid) {
                disableLeaveWarning();

                saveOrganizerAuth(login, remember);
                await cacheOrganizerProfileOnce(login);

                window.location.href = 'organizer.html';
            } else {
                showMessage(passwordMessageDiv, 'Неверный логин или пароль', 'error');

                passwordSubmit.disabled = false;
                passwordSubmit.innerText = 'Войти';
            }

        } catch (err) {
            console.error('Ошибка входа по паролю:', err);

            showMessage(passwordMessageDiv, 'Ошибка соединения. Попробуйте позже.', 'error');

            passwordSubmit.disabled = false;
            passwordSubmit.innerText = 'Войти';
        }
    });


    function startResendTimer(seconds = 60) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        timerSeconds = seconds;

        resendCodeBtn.style.display = 'none';
        resendCodeBtn.disabled = true;

        resendTimerSpan.style.display = 'inline-block';
        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timerSeconds--;

            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;

                resendTimerSpan.innerHTML = '';
                resendTimerSpan.style.display = 'none';

                resendCodeBtn.disabled = false;
                resendCodeBtn.style.display = 'inline-block';

                return;
            }

            updateTimerDisplay();
        }, 1000);
    }

    function updateTimerDisplay() {
        resendTimerSpan.innerHTML = `Повторная отправка через ${timerSeconds} сек.`;
    }


    async function requestCode() {
        const email = emailInput.value.trim();

        if (!email) {
            showMessage(emailMessageDiv, 'Введите email', 'error');
            return false;
        }

        if (!isValidEmail(email)) {
            showMessage(emailMessageDiv, 'Введите корректный email', 'error');
            return false;
        }

        sendCodeBtn.disabled = true;
        sendCodeBtn.innerText = 'Отправка...';

        resendCodeBtn.disabled = true;
        resendCodeBtn.style.display = 'none';

        hideMessage(emailMessageDiv);
        hideMessage(codeMessageDiv);

        try {
            const result = await sendLoginCode(email);

            if (result.success) {
                currentEmail = email;
                codeSessionActive = true;

                enableLeaveWarning();

                showMessage(
                    emailMessageDiv,
                    `Код отправлен на ${email}. Действует 5 минут.`,
                    'success'
                );

                emailStepDiv.style.display = 'none';
                codeStepDiv.style.display = 'block';

                verificationCodeInput.value = '';
                verificationCodeInput.focus();

                sendCodeBtn.disabled = false;
                sendCodeBtn.innerText = 'Отправить код';

                startResendTimer(60);

                return true;

            } else {
                showMessage(
                    emailMessageDiv,
                    result.error || 'Ошибка отправки. Попробуйте позже.',
                    'error'
                );

                sendCodeBtn.disabled = false;
                sendCodeBtn.innerText = 'Отправить код';

                return false;
            }

        } catch (err) {
            console.error('Ошибка отправки кода:', err);

            showMessage(emailMessageDiv, 'Ошибка соединения. Попробуйте позже.', 'error');

            sendCodeBtn.disabled = false;
            sendCodeBtn.innerText = 'Отправить код';

            return false;
        }
    }

    sendCodeBtn.addEventListener('click', requestCode);

    resendCodeBtn.addEventListener('click', async () => {
        if (resendCodeBtn.disabled) return;

        resendCodeBtn.disabled = true;
        resendCodeBtn.style.display = 'none';

        await requestCode();
    });

    verifyCodeBtn.addEventListener('click', async () => {
        const code = verificationCodeInput.value.trim();

        if (!code || code.length < 6) {
            showMessage(codeMessageDiv, 'Введите 6-значный код из письма', 'error');
            return;
        }

        verifyCodeBtn.disabled = true;
        verifyCodeBtn.innerText = 'Проверка...';

        hideMessage(codeMessageDiv);

        try {
            const isValid = await verifyLoginCode(currentEmail, code);

            if (isValid) {
                disableLeaveWarning();

                clearCachedOrganizerProfile();

                sessionStorage.setItem('organizerAuth', 'true');
                sessionStorage.setItem('organizerLogin', currentEmail);

                await cacheOrganizerProfileOnce(currentEmail);

                localStorage.removeItem('organizerRemember');
                localStorage.removeItem('organizerAuth');
                localStorage.removeItem('organizerLogin');

                window.location.href = 'organizer.html';

            } else {
                showMessage(codeMessageDiv, 'Неверный или просроченный код. Запросите новый.', 'error');

                verifyCodeBtn.disabled = false;
                verifyCodeBtn.innerText = 'Подтвердить и войти';
            }

        } catch (err) {
            console.error('Ошибка проверки кода:', err);

            showMessage(codeMessageDiv, 'Ошибка соединения. Попробуйте позже.', 'error');

            verifyCodeBtn.disabled = false;
            verifyCodeBtn.innerText = 'Подтвердить и войти';
        }
    });


    verificationCodeInput.addEventListener('input', () => {
        verificationCodeInput.value = verificationCodeInput.value
            .replace(/\D/g, '')
            .slice(0, 6);
    });


    verificationCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyCodeBtn.click();
        }
    });

    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            requestCode();
        }
    });

    loginInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordSubmit.click();
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordSubmit.click();
        }
    });
